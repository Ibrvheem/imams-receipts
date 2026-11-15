import { notFound } from "next/navigation";
import { getReceipt } from "../queries";
import { ReceiptView } from "./receipt-view";

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const receipt = await getReceipt(id);
  if (!receipt) notFound();
  return (
    <ReceiptView
      receipt={receipt}
      justSaved={saved === "new" ? "new" : saved === "edit" ? "edit" : undefined}
    />
  );
}
