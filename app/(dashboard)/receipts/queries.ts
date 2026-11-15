// Read-side data for the receipts pages. Server only; every query checks the
// session first.
import "server-only";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  dbDateToIso,
  isoToDbDate,
  startOfMonth,
  startOfWeek,
  todayInLagos,
} from "@/lib/dates";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ReceiptRecord } from "./_receipt/types";

export const PAGE_SIZE = 20;

const withItems = {
  items: { orderBy: { position: "asc" } },
} satisfies Prisma.ReceiptInclude;

type ReceiptWithItems = Prisma.ReceiptGetPayload<{ include: typeof withItems }>;

export function toRecord(r: ReceiptWithItems): ReceiptRecord {
  return {
    id: r.id,
    number: r.number,
    date: dbDateToIso(r.date),
    customerId: r.customerId,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    customerAddress: r.customerAddress,
    items: r.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    })),
    subtotal: Number(r.subtotal),
    discount: Number(r.discount),
    total: Number(r.total),
    amountPaid: Number(r.amountPaid),
    balance: Number(r.balance),
    partPayment: r.partPayment,
    paymentMethod: r.paymentMethod,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getReceipt(id: string) {
  await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const r = await prisma.receipt.findUnique({ where: { id }, include: withItems });
  return r ? toRecord(r) : null;
}

/** Compact row for lists. */
export type ReceiptRow = {
  id: string;
  number: string;
  date: string;
  customerName: string;
  total: number;
  balance: number;
};

const rowSelect = {
  id: true,
  number: true,
  date: true,
  customerName: true,
  total: true,
  balance: true,
} satisfies Prisma.ReceiptSelect;

function toRow(r: Prisma.ReceiptGetPayload<{ select: typeof rowSelect }>): ReceiptRow {
  return {
    id: r.id,
    number: r.number,
    date: dbDateToIso(r.date),
    customerName: r.customerName,
    total: Number(r.total),
    balance: Number(r.balance),
  };
}

export type ReceiptFilters = {
  q?: string;
  status?: "paid" | "owing";
  from?: string;
  to?: string;
  customerId?: string;
  page?: number;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function listReceipts(filters: ReceiptFilters) {
  await requireUser();
  const q = filters.q?.trim();
  const from = filters.from && ISO.test(filters.from) ? filters.from : null;
  const to = filters.to && ISO.test(filters.to) ? filters.to : null;
  const where: Prisma.ReceiptWhereInput = {
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.status === "owing" ? { balance: { gt: 0 } } : {}),
    ...(filters.status === "paid" ? { balance: 0 } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: isoToDbDate(from) } : {}),
            ...(to ? { lte: isoToDbDate(to) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { customerPhone: { contains: q.replace(/\s+/g, "") } },
          ],
        }
      : {}),
  };
  const page = Math.max(1, filters.page ?? 1);
  const [total, rows, sums] = await Promise.all([
    prisma.receipt.count({ where }),
    prisma.receipt.findMany({
      where,
      select: rowSelect,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.receipt.aggregate({ where, _sum: { total: true, balance: true } }),
  ]);
  return {
    rows: rows.map(toRow),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    sumTotal: Number(sums._sum.total ?? 0),
    sumBalance: Number(sums._sum.balance ?? 0),
  };
}

export async function getDashboard() {
  await requireUser();
  const today = todayInLagos();
  const sales = (from: string) =>
    prisma.receipt.aggregate({
      where: { date: { gte: isoToDbDate(from), lte: isoToDbDate(today) } },
      _sum: { total: true },
      _count: true,
    });
  const [day, week, month, owing, recent] = await Promise.all([
    sales(today),
    sales(startOfWeek(today)),
    sales(startOfMonth(today)),
    prisma.receipt.aggregate({
      where: { balance: { gt: 0 } },
      _sum: { balance: true },
      _count: true,
    }),
    prisma.receipt.findMany({
      select: rowSelect,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);
  const stat = (a: typeof day) => ({
    amount: Number(a._sum.total ?? 0),
    count: a._count,
  });
  return {
    today: stat(day),
    week: stat(week),
    month: stat(month),
    owing: { amount: Number(owing._sum.balance ?? 0), count: owing._count },
    recent: recent.map(toRow),
  };
}
