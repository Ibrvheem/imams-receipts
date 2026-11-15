import { requireUser } from "@/lib/dal";
import { getCustomer } from "../../customers/queries";
import { ReceiptForm } from "../_receipt/_components/receipt-form";

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  await requireUser();
  // "New receipt" from a customer's page starts with their details filled in.
  const { customer: customerId } = await searchParams;
  const customer = customerId ? await getCustomer(customerId) : null;
  return (
    <ReceiptForm
      customer={
        customer
          ? {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              address: customer.address,
            }
          : undefined
      }
    />
  );
}
