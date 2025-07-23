/*
  Warnings:

  - You are about to drop the `group_budget_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_budgets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `investment_records` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `account_type` on the `financial_accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `transaction_type` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('income', 'expense', 'transfer');

-- CreateEnum
CREATE TYPE "account_type" AS ENUM ('checking', 'savings', 'credit_card', 'investment', 'loan');

-- DropForeignKey
ALTER TABLE "group_budget_members" DROP CONSTRAINT "group_budget_members_group_budget_id_fkey";

-- DropForeignKey
ALTER TABLE "group_budget_members" DROP CONSTRAINT "group_budget_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "group_budgets" DROP CONSTRAINT "group_budgets_created_by_fkey";

-- DropForeignKey
ALTER TABLE "investment_records" DROP CONSTRAINT "investment_records_account_id_fkey";

-- DropForeignKey
ALTER TABLE "investment_records" DROP CONSTRAINT "investment_records_user_id_fkey";

-- AlterTable
ALTER TABLE "financial_accounts" DROP COLUMN "account_type",
ADD COLUMN     "account_type" "account_type" NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "budget_id" INTEGER,
DROP COLUMN "transaction_type",
ADD COLUMN     "transaction_type" "transaction_type" NOT NULL;

-- DropTable
DROP TABLE "group_budget_members";

-- DropTable
DROP TABLE "group_budgets";

-- DropTable
DROP TABLE "investment_records";

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
