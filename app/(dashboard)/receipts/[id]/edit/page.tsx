import { notFound } from "next/navigation";
import { getReceipt } from "../../queries";
import { ReceiptForm } from "../../_receipt/_components/receipt-form";

export default async function EditReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const receipt = await getReceipt((await params).id);
  if (!receipt) notFound();
  return <ReceiptForm initial={receipt} />;
}
