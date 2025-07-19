/*
  Warnings:

  - Changed the type of `notification_method` on the `alerts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `period_type` on the `budgets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `account_type` on the `financial_accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `period_type` on the `group_budgets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `asset_type` on the `investment_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `transaction_type` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('income', 'expense', 'transfer');

-- CreateEnum
CREATE TYPE "period_type" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');

-- CreateEnum
CREATE TYPE "account_type" AS ENUM ('checking', 'savings', 'credit_card', 'investment', 'loan', 'other');

-- CreateEnum
CREATE TYPE "notification_method" AS ENUM ('email', 'sms', 'push', 'in_app');

-- CreateEnum
CREATE TYPE "asset_type" AS ENUM ('stock', 'bond', 'etf', 'mutual_fund', 'crypto', 'real_estate', 'commodity', 'other');

-- AlterTable
ALTER TABLE "alerts" DROP COLUMN "notification_method",
ADD COLUMN     "notification_method" "notification_method" NOT NULL;

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "period_type",
ADD COLUMN     "period_type" "period_type" NOT NULL;

-- AlterTable
ALTER TABLE "financial_accounts" ADD COLUMN     "bank_token_id" INTEGER,
DROP COLUMN "account_type",
ADD COLUMN     "account_type" "account_type" NOT NULL;

-- AlterTable
ALTER TABLE "group_budget_members" ADD COLUMN     "actual_contribution" DECIMAL(15,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "group_budgets" DROP COLUMN "period_type",
ADD COLUMN     "period_type" "period_type" NOT NULL;

-- AlterTable
ALTER TABLE "investment_records" DROP COLUMN "asset_type",
ADD COLUMN     "asset_type" "asset_type" NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "budget_id" INTEGER,
ADD COLUMN     "group_budget_id" INTEGER,
DROP COLUMN "transaction_type",
ADD COLUMN     "transaction_type" "transaction_type" NOT NULL;

-- CreateIndex
CREATE INDEX "idx_financial_accounts_bank_token_id" ON "financial_accounts"("bank_token_id");

-- CreateIndex
CREATE INDEX "idx_investment_records_account_id" ON "investment_records"("account_id");

-- CreateIndex
CREATE INDEX "idx_transactions_budget_id" ON "transactions"("budget_id");

-- CreateIndex
CREATE INDEX "idx_transactions_group_budget_id" ON "transactions"("group_budget_id");

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_bank_token_id_fkey" FOREIGN KEY ("bank_token_id") REFERENCES "bank_tokens"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_group_budget_id_fkey" FOREIGN KEY ("group_budget_id") REFERENCES "group_budgets"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
