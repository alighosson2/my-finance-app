import { PrismaClient } from '@prisma/client';
import { ConnectionManager } from '../Repositories/ConnectionManager';
import * as bcrypt from 'bcryptjs';

interface DemoUser {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
}

const demoUsers: DemoUser[] = [
  { name: 'John Smith', email: 'john.smith@demo.com', role: 'admin' },
  { name: 'Sarah Johnson', email: 'sarah.johnson@demo.com', role: 'user' },
  { name: 'Mike Williams', email: 'mike.williams@demo.com', role: 'manager' },
  { name: 'Emily Davis', email: 'emily.davis@demo.com', role: 'user' },
  { name: 'David Brown', email: 'david.brown@demo.com', role: 'user' },
];

const transactionCategories = [
  { category: 'Food', subcategories: ['Groceries', 'Restaurants', 'Fast Food', 'Coffee'] },
  { category: 'Transportation', subcategories: ['Gas', 'Public Transit', 'Uber/Lyft', 'Parking'] },
  { category: 'Entertainment', subcategories: ['Movies', 'Streaming', 'Games', 'Books'] },
  { category: 'Utilities', subcategories: ['Electricity', 'Water', 'Internet', 'Phone'] },
  { category: 'Healthcare', subcategories: ['Doctor', 'Dentist', 'Pharmacy', 'Insurance'] },
  { category: 'Shopping', subcategories: ['Clothing', 'Electronics', 'Home', 'Personal Care'] },
  { category: 'Income', subcategories: ['Salary', 'Freelance', 'Investment', 'Other'] },
];

const merchants = [
  'Walmart', 'Target', 'Amazon', 'Starbucks', 'McDonald\'s', 'Shell', 'Exxon',
  'Home Depot', 'Best Buy', 'Apple Store', 'Netflix', 'Spotify', 'CVS Pharmacy',
  'Walgreens', 'Whole Foods', 'Trader Joe\'s', 'Costco', 'Gas Station', 'Local Restaurant'
];

async function generateDummyData() {
  console.log('🚀 Starting dummy data generation...');

  const prisma = await ConnectionManager.getConnection();

  try {
    // Clear existing data (optional - uncomment if you want to reset)
    // console.log('🧹 Clearing existing data...');
    // await prisma.transactions.deleteMany();
    // await prisma.budgets.deleteMany();
    // await prisma.alerts.deleteMany();
    // await prisma.tax_records.deleteMany();
    // await prisma.bank_tokens.deleteMany();
    // await prisma.financial_accounts.deleteMany();
    // await prisma.users.deleteMany();

    // Create or update users
    console.log('👥 Creating/updating users...');
    const users = [];
    for (const demoUser of demoUsers) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      const user = await prisma.users.upsert({
        where: { email: demoUser.email },
        update: {
          name: demoUser.name,
          password_hash: hashedPassword,
          role: demoUser.role,
          profile_settings: {
            currency: 'USD',
            timezone: 'America/New_York',
            notifications: true
          }
        },
        create: {
          name: demoUser.name,
          email: demoUser.email,
          password_hash: hashedPassword,
          role: demoUser.role,
          profile_settings: {
            currency: 'USD',
            timezone: 'America/New_York',
            notifications: true
          }
        }
      });
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users`);

    // Create financial accounts
    console.log('🏦 Creating financial accounts...');
    const accounts = [];
    const accountTypes = ['checking', 'savings', 'credit_card', 'investment', 'loan'];
    const banks = ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One'];

    for (const user of users) {
      // Check if user already has accounts
      const existingAccounts = await prisma.financial_accounts.findMany({
        where: { user_id: user.id }
      });

      if (existingAccounts.length > 0) {
        console.log(`📋 User ${user.email} already has ${existingAccounts.length} accounts, skipping account creation`);
        accounts.push(...existingAccounts);
        continue;
      }

      // Each user gets 2-4 accounts
      const numAccounts = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < numAccounts; i++) {
        const accountType = accountTypes[Math.floor(Math.random() * accountTypes.length)] as any;
        const bank = banks[Math.floor(Math.random() * banks.length)];
        const balance = accountType === 'credit_card' ?
          -(Math.random() * 5000) : // Negative balance for credit cards
          Math.random() * 50000; // Positive balance for other accounts

        const account = await prisma.financial_accounts.create({
          data: {
            user_id: user.id,
            account_name: `${bank} ${accountType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
            account_type: accountType,
            balance: balance,
            currency: 'USD',
            bank_name: bank,
            account_number_masked: `****${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            external_account_id: `ext_${Math.random().toString(36).substring(7)}`,
            bank_id: `bank_${Math.random().toString(36).substring(7)}`,
            last_synced_at: new Date()
          }
        });
        accounts.push(account);
      }
    }
    console.log(`✅ Created ${accounts.length} financial accounts`);

    // Create budgets
    console.log('📊 Creating budgets...');
    const budgets = [];
    for (const user of users) {
      // Check if user already has budgets
      const existingBudgets = await prisma.budgets.findMany({
        where: { user_id: user.id }
      });

      if (existingBudgets.length > 0) {
        console.log(`📋 User ${user.email} already has ${existingBudgets.length} budgets, skipping budget creation`);
        budgets.push(...existingBudgets);
        continue;
      }

      for (const catData of transactionCategories.slice(0, 5)) { // First 5 categories
        if (catData.category !== 'Income') {
          const budget = await prisma.budgets.create({
            data: {
              user_id: user.id,
              budget_name: `${catData.category} Budget`,
              category: catData.category,
              subcategory: catData.subcategories[0],
              budget_limit: Math.floor(Math.random() * 2000) + 500,
              period_type: 'monthly',
              start_date: new Date('2024-01-01'),
              end_date: new Date('2024-12-31')
            }
          });
          budgets.push(budget);
        }
      }
    }
    console.log(`✅ Created ${budgets.length} budgets`);

    // Create transactions
    console.log('💰 Creating transactions...');
    const transactions = [];
    for (const account of accounts) {
      // Check if account already has transactions
      const existingTransactions = await prisma.transactions.findMany({
        where: { account_id: account.id }
      });

      if (existingTransactions.length > 0) {
        console.log(`📋 Account ${account.account_name} already has ${existingTransactions.length} transactions, skipping transaction creation`);
        transactions.push(...existingTransactions);
        continue;
      }

      // Each account gets 20-50 transactions
      const numTransactions = Math.floor(Math.random() * 31) + 20;
      for (let i = 0; i < numTransactions; i++) {
        const catData = transactionCategories[Math.floor(Math.random() * transactionCategories.length)];
        const subcategory = catData.subcategories[Math.floor(Math.random() * catData.subcategories.length)];
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];

        const isIncome = catData.category === 'Income';
        const transactionType = isIncome ? 'income' : 'expense';
        const amount = isIncome ?
          Math.floor(Math.random() * 5000) + 1000 : // Income: $1000-$6000
          Math.floor(Math.random() * 500) + 10; // Expense: $10-$510

        // Random date within last 6 months
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 180));

        // Find matching budget
        const matchingBudget = budgets.find(b =>
          b.user_id === account.user_id && b.category === catData.category
        );

        const transaction = await prisma.transactions.create({
          data: {
            user_id: account.user_id,
            account_id: account.id,
            budget_id: matchingBudget?.id || null,
            amount: amount,
            transaction_date: date,
            description: `${merchant} - ${subcategory}`,
            category: catData.category,
            subcategory: subcategory,
            transaction_type: transactionType as any,
            merchant_name: merchant,
            location: `${Math.floor(Math.random() * 50) + 1} Main St, Demo City`,
            is_recurring: Math.random() < 0.1, // 10% chance of recurring
            tags: [catData.category.toLowerCase(), subcategory.toLowerCase()],
            external_transaction_id: `tx_${Math.random().toString(36).substring(7)}`,
            import_source: Math.random() < 0.7 ? 'obp' : 'manual', // 70% from OBP
            sync_status: 'synced'
          }
        });
        transactions.push(transaction);
      }
    }
    console.log(`✅ Created ${transactions.length} transactions`);

    // Create tax records
    console.log('📋 Creating tax records...');
    const taxRecords = [];
    for (const user of users) {
      for (const year of [2022, 2023, 2024]) {
        const income = Math.floor(Math.random() * 80000) + 30000; // $30k-$110k
        const taxRecord = await prisma.tax_records.create({
          data: {
            user_id: user.id,
            tax_year: year,
            taxable_income: income,
            estimated_tax: income * 0.22, // 22% tax rate
            tax_bracket: income > 80000 ? '22%' : income > 40000 ? '12%' : '10%',
            filing_status: Math.random() < 0.6 ? 'single' : 'married',
            deductions: Math.floor(Math.random() * 15000) + 5000,
            credits: Math.floor(Math.random() * 3000)
          }
        });
        taxRecords.push(taxRecord);
      }
    }
    console.log(`✅ Created ${taxRecords.length} tax records`);

    // Create alerts
    console.log('🔔 Creating alerts...');
    const alerts = [];
    const alertTypes = [
      { name: 'Budget Alert', rule: 'Budget spending over 80%', condition: { type: 'budget_threshold', value: 80 } },
      { name: 'Large Transaction', rule: 'Transaction over $500', condition: { type: 'transaction_amount', value: 500 } },
      { name: 'Low Balance', rule: 'Account balance below $100', condition: { type: 'balance_threshold', value: 100 } },
      { name: 'Monthly Summary', rule: 'Monthly spending summary', condition: { type: 'monthly_summary' } }
    ];

    for (const user of users) {
      for (const alertType of alertTypes) {
        const alert = await prisma.alerts.create({
          data: {
            user_id: user.id,
            alert_name: alertType.name,
            rule_description: alertType.rule,
            trigger_condition: alertType.condition,
            notification_method: Math.random() < 0.5 ? 'email' : 'push',
            is_active: Math.random() < 0.8, // 80% active
            last_triggered: Math.random() < 0.3 ? new Date() : null // 30% recently triggered
          }
        });
        alerts.push(alert);
      }
    }
    console.log(`✅ Created ${alerts.length} alerts`);

    // Create bank tokens
    console.log('🔐 Creating bank tokens...');
    const bankTokens = [];
    const providers = ['chase', 'bofa', 'wells_fargo', 'citi', 'capital_one'];

    for (const user of users) {
      // Each user has 1-2 bank integrations
      const numTokens = Math.floor(Math.random() * 2) + 1;
      const userProviders = providers.slice(0, numTokens);

      for (const provider of userProviders) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

        const bankToken = await prisma.bankToken.create({
          data: {
            user_id: user.id,
            provider: provider,
            access_token: `access_${Math.random().toString(36).substring(7)}`,
            access_token_secret: `secret_${Math.random().toString(36).substring(7)}`,
            refresh_token: `refresh_${Math.random().toString(36).substring(7)}`,
            expires_at: expiresAt
          }
        });
        bankTokens.push(bankToken);
      }
    }
    console.log(`✅ Created ${bankTokens.length} bank tokens`);

    console.log('🎉 Dummy data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Financial Accounts: ${accounts.length}`);
    console.log(`- Transactions: ${transactions.length}`);
    console.log(`- Budgets: ${budgets.length}`);
    console.log(`- Tax Records: ${taxRecords.length}`);
    console.log(`- Alerts: ${alerts.length}`);
    console.log(`- Bank Tokens: ${bankTokens.length}`);
    console.log('\n🔑 Demo login credentials:');
    console.log('Email: john.smith@demo.com | Password: demo123 (Admin)');
    console.log('Email: sarah.johnson@demo.com | Password: demo123 (User)');
    console.log('Email: mike.williams@demo.com | Password: demo123 (Manager)');

  } catch (error) {
    console.error('❌ Error generating dummy data:', error);
    throw error;
  } finally {
    await ConnectionManager.closeConnection();
  }
}

// Run the script
if (require.main === module) {
  generateDummyData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default generateDummyData;
