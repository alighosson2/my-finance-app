-- CreateTable
CREATE TABLE "alerts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "alert_name" VARCHAR(255) NOT NULL,
    "rule_description" TEXT NOT NULL,
    "trigger_condition" JSONB NOT NULL,
    "notification_method" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "last_triggered" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "budget_name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "subcategory" VARCHAR(100),
    "budget_limit" DECIMAL(15,2) NOT NULL,
    "period_type" VARCHAR(20) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "account_name" VARCHAR(255) NOT NULL,
    "account_type" VARCHAR(50) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "bank_name" VARCHAR(255),
    "account_number_masked" VARCHAR(20),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_budget_members" (
    "id" SERIAL NOT NULL,
    "group_budget_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "contribution_limit" DECIMAL(15,2),
    "joined_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_budget_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_budgets" (
    "id" SERIAL NOT NULL,
    "group_name" VARCHAR(255) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "description" TEXT,
    "budget_limit" DECIMAL(15,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "period_type" VARCHAR(20) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_records" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "account_id" INTEGER,
    "asset_name" VARCHAR(255) NOT NULL,
    "asset_type" VARCHAR(50) NOT NULL,
    "symbol" VARCHAR(20),
    "quantity" DECIMAL(15,8) NOT NULL,
    "purchase_price" DECIMAL(15,2),
    "current_price" DECIMAL(15,2),
    "current_value" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "purchase_date" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_records" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tax_year" INTEGER NOT NULL,
    "taxable_income" DECIMAL(15,2) NOT NULL,
    "estimated_tax" DECIMAL(15,2),
    "tax_bracket" VARCHAR(20),
    "filing_status" VARCHAR(20),
    "deductions" DECIMAL(15,2) DEFAULT 0.00,
    "credits" DECIMAL(15,2) DEFAULT 0.00,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "transaction_date" TIMESTAMPTZ(6) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100),
    "subcategory" VARCHAR(100),
    "transaction_type" VARCHAR(20) NOT NULL,
    "merchant_name" VARCHAR(255),
    "location" VARCHAR(255),
    "is_recurring" BOOLEAN DEFAULT false,
    "tags" TEXT[],
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "profile_settings" JSONB DEFAULT '{}',
    "date_joined" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_alerts_user_id" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "idx_budgets_user_id" ON "budgets"("user_id");

-- CreateIndex
CREATE INDEX "idx_financial_accounts_user_id" ON "financial_accounts"("user_id");

-- CreateIndex
CREATE INDEX "idx_group_budget_members_group_id" ON "group_budget_members"("group_budget_id");

-- CreateIndex
CREATE INDEX "idx_group_budget_members_user_id" ON "group_budget_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_budget_members_group_budget_id_user_id_key" ON "group_budget_members"("group_budget_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_group_budgets_created_by" ON "group_budgets"("created_by");

-- CreateIndex
CREATE INDEX "idx_investment_records_user_id" ON "investment_records"("user_id");

-- CreateIndex
CREATE INDEX "idx_tax_records_user_id" ON "tax_records"("user_id");

-- CreateIndex
CREATE INDEX "idx_tax_records_year" ON "tax_records"("tax_year");

-- CreateIndex
CREATE UNIQUE INDEX "tax_records_user_id_tax_year_key" ON "tax_records"("user_id", "tax_year");

-- CreateIndex
CREATE INDEX "idx_transactions_account_id" ON "transactions"("account_id");

-- CreateIndex
CREATE INDEX "idx_transactions_category" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "idx_transactions_date" ON "transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "idx_transactions_user_id" ON "transactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_budget_members" ADD CONSTRAINT "group_budget_members_group_budget_id_fkey" FOREIGN KEY ("group_budget_id") REFERENCES "group_budgets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_budget_members" ADD CONSTRAINT "group_budget_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_budgets" ADD CONSTRAINT "group_budgets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "investment_records" ADD CONSTRAINT "investment_records_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "investment_records" ADD CONSTRAINT "investment_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tax_records" ADD CONSTRAINT "tax_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
