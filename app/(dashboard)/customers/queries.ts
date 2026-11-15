import "server-only";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export const PAGE_SIZE = 20;

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  receipts: number;
  spent: number;
  owing: number;
  lastDate: string | null;
};

async function summarize(
  customers: { id: string; name: string; phone: string | null; address: string | null }[],
): Promise<CustomerSummary[]> {
  if (!customers.length) return [];
  const stats = await prisma.receipt.groupBy({
    by: ["customerId"],
    where: { customerId: { in: customers.map((c) => c.id) } },
    _count: true,
    _sum: { total: true, balance: true },
    _max: { date: true },
  });
  const byId = new Map(stats.map((s) => [s.customerId, s]));
  return customers.map((c) => {
    const s = byId.get(c.id);
    return {
      ...c,
      receipts: s?._count ?? 0,
      spent: Number(s?._sum.total ?? 0),
      owing: Number(s?._sum.balance ?? 0),
      lastDate: s?._max.date ? s._max.date.toISOString().slice(0, 10) : null,
    };
  });
}

export async function listCustomers({ q, page = 1 }: { q?: string; page?: number }) {
  await requireUser();
  const term = q?.trim();
  const where: Prisma.CustomerWhereInput = term
    ? {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { phone: { contains: term.replace(/\s+/g, "") } },
        ],
      }
    : {};
  const current = Math.max(1, page);
  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      select: { id: true, name: true, phone: true, address: true },
      orderBy: { updatedAt: "desc" },
      skip: (current - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return {
    rows: await summarize(customers),
    total,
    page: current,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getCustomer(id: string) {
  await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, address: true },
  });
  if (!customer) return null;
  const [summary] = await summarize([customer]);
  return summary;
}
