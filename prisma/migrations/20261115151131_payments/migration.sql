-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" DATE NOT NULL,
    "method" TEXT NOT NULL,
    "initial" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_receipt_id_idx" ON "payments"("receipt_id");

-- CreateIndex
CREATE INDEX "payments_date_idx" ON "payments"("date");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: existing receipts get one initial payment for what was already paid.
INSERT INTO "payments" ("id", "receipt_id", "amount", "date", "method", "initial")
SELECT gen_random_uuid(), "id", "amount_paid", "date", "payment_method", true
FROM "receipts"
WHERE "amount_paid" > 0;
