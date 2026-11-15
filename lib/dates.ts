// The business runs on Lagos time, whatever timezone the server is in.
import dayjs from "dayjs";

const lagos = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Lagos",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today in Lagos as "YYYY-MM-DD". */
export const todayInLagos = () => lagos.format(new Date());

/** Monday of the week containing `iso`, as "YYYY-MM-DD". */
export function startOfWeek(iso: string) {
  const d = dayjs(iso);
  const fromMonday = (d.day() + 6) % 7;
  return d.subtract(fromMonday, "day").format("YYYY-MM-DD");
}

export const startOfMonth = (iso: string) => `${iso.slice(0, 7)}-01`;

/** Postgres DATE columns map to UTC-midnight Dates in Prisma. */
export const isoToDbDate = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
export const dbDateToIso = (d: Date) => d.toISOString().slice(0, 10);
