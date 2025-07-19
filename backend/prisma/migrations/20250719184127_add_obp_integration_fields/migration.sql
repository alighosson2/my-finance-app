-- AlterTable
ALTER TABLE "financial_accounts" ADD COLUMN     "bank_id" VARCHAR(100),
ADD COLUMN     "external_account_id" VARCHAR(100),
ADD COLUMN     "last_synced_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "external_transaction_id" VARCHAR(100),
ADD COLUMN     "import_source" VARCHAR(20) DEFAULT 'manual',
ADD COLUMN     "sync_status" VARCHAR(20) DEFAULT 'synced';
