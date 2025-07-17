-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'user', 'manager');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "bank_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "access_token" VARCHAR(255) NOT NULL,
    "access_token_secret" VARCHAR(255),
    "refresh_token" VARCHAR(255),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_bank_token_user_id" ON "bank_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_bank_token_provider" ON "bank_tokens"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "bank_tokens_user_id_provider_key" ON "bank_tokens"("user_id", "provider");

-- AddForeignKey
ALTER TABLE "bank_tokens" ADD CONSTRAINT "bank_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
