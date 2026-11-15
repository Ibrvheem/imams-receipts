"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { isoToDbDate } from "@/lib/dates";
import { Prisma } from "@/lib/generated/prisma/client";
import { receiptInputSchema } from "./_receipt/types";
import { computeTotals, generateReceiptNumber } from "./_receipt/totals";

type SaveResult =
  | { success: true; id: string; number: string }
  | { success: false; message: string };

const NUMBER_FORMAT = /^IBL-\d{6}-\d{4}$/;
// Prisma's default 5s is too tight on a slow link to the database.
const TX = { maxWait: 10_000, timeout: 20_000 };
const blank = (v?: string) => (v && v.trim() ? v.trim() : null);

/** Finds the saved customer for this receipt, or creates one. */
async function resolveCustomer(
  tx: Prisma.TransactionClient,
  input: { customerId?: string; customerName: string; customerPhone?: string; customerAddress?: string },
) {
  const name = input.customerName.trim();
  const phone = blank(input.customerPhone)?.replace(/\s+/g, "") ?? null;
  const address = blank(input.customerAddress);

  const existing =
    (input.customerId
      ? await tx.customer.findUnique({ where: { id: input.customerId } })
      : null) ??
    (phone ? await tx.customer.findFirst({ where: { phone } }) : null) ??
    // Same name: a match unless both have phones (then the phones decide).
    (await tx.customer.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(phone ? { phone: null } : {}),
      },
      orderBy: { updatedAt: "desc" },
    }));

  if (!existing) {
    return (await tx.customer.create({ data: { name, phone, address } })).id;
  }
  // Keep the customer's details current with what she just typed.
  await tx.customer.update({
    where: { id: existing.id },
    data: { name, phone: phone ?? existing.phone, address: address ?? existing.address },
  });
  return existing.id;
}

/**
 * Creates a receipt (no id) or updates one, then redirects to it. Only
 * returns when the save failed.
 */
export async function saveReceipt(
  raw: unknown,
  id?: string,
): Promise<{ success: false; message: string }> {
  const user = await requireUser();
  const result = await persist(raw, user.id, id);
  if (!result.success) return result;
  revalidatePath("/", "layout");
  // Outside any try/catch: redirect() works by throwing.
  redirect(`/receipts/${result.id}?saved=${id ? "edit" : "new"}`);
}

async function persist(raw: unknown, userId: string, id?: string): Promise<SaveResult> {
  const parsed = receiptInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Some details are missing or invalid." };
  }
  const input = parsed.data;
  const totals = computeTotals(input);

  const data = {
    date: isoToDbDate(input.date),
    customerName: input.customerName.trim(),
    customerPhone: blank(input.customerPhone),
    customerAddress: blank(input.customerAddress),
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    amountPaid: totals.paid,
    balance: totals.balance,
    partPayment: input.partPayment,
    paymentMethod: input.paymentMethod,
    note: blank(input.note),
  };
  const items = input.items.map((item, position) => ({
    position,
    description: item.description.trim(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));

  try {
    if (id) {
      const saved = await prisma.$transaction(async (tx) => {
        const customerId = await resolveCustomer(tx, {
          ...input,
          customerId: input.customerId || undefined,
        });
        await tx.receiptItem.deleteMany({ where: { receiptId: id } });
        return tx.receipt.update({
          where: { id },
          data: { ...data, customerId, items: { create: items } },
        });
      }, TX);
      return { success: true, id: saved.id, number: saved.number };
    }

    // Keep the number shown on the preview when it's free; otherwise pick a
    // fresh one. Retries cover the (rare) random collision.
    let number = NUMBER_FORMAT.test(input.receiptNumber)
      ? input.receiptNumber
      : generateReceiptNumber();
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const saved = await prisma.$transaction(async (tx) => {
          const customerId = await resolveCustomer(tx, {
            ...input,
            customerId: input.customerId || undefined,
          });
          return tx.receipt.create({
            data: {
              ...data,
              number,
              customerId,
              createdById: userId,
              items: { create: items },
            },
          });
        }, TX);
        return { success: true, id: saved.id, number: saved.number };
      } catch (error) {
        const clash =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002";
        if (!clash) throw error;
        number = generateReceiptNumber(new Date(`${input.date}T12:00:00`));
      }
    }
    return { success: false, message: "Couldn't assign a receipt number. Try again." };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { success: false, message: "This receipt no longer exists." };
    }
    console.error(error);
    return { success: false, message: "Couldn't save the receipt. Try again." };
  }
}

export async function deleteReceipt(id: string) {
  await requireUser();
  await prisma.receipt.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  return { success: true };
}

export type CustomerSuggestion = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
};

export async function searchCustomers(query: string): Promise<CustomerSuggestion[]> {
  await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];
  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q.replace(/\s+/g, "") } },
      ],
    },
    select: { id: true, name: true, phone: true, address: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
}
