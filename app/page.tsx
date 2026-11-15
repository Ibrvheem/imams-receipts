import { Suspense } from "react";
import { ReceiptGenerator } from "./_receipt/_components/receipt-generator";

// Public for now (no login). Move under (dashboard) once the backend for
// login + saved receipts exists.
export default function Home() {
  return (
    <main className="flex-1">
      {/* ControlledSelect reads search params, which needs a Suspense boundary */}
      <Suspense>
        <ReceiptGenerator />
      </Suspense>
    </main>
  );
}
