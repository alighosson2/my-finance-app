# 🏦 MyFinance360 Dashboard Workflow Guide

## 📋 **Step-by-Step Usage Guide**

### **Phase 1: Bank Connection Setup**

#### **Step 1: Connect Bank Account**
```
1. Go to Dashboard → "Connect Bank Account" section
2. Fill in:
   - Provider: "Bank Of America" (or your bank name)
   - Access Token: "test-token-123" (for testing)
   - Expires At: (auto-filled to tomorrow)
3. Click "Connect Bank Account"
```

**✅ Expected Result:** Server logs `POST 201 /api/bank/api/tokens`

#### **Step 2: Test Connection** 
```
1. Click "Test Connection" button
2. Verifies your bank API connection is working
```

**✅ Expected Result:** Server logs `POST 200 /api/bank/api/sync/test`

---

### **Phase 2: Data Synchronization**

#### **Step 3: Sync Bank Accounts**
```
1. Click "Sync Accounts" button
2. Downloads your bank account information
3. Creates entries in financial_accounts table
```

**✅ Expected Result:** 
- Server logs `POST 200 /api/bank/api/sync/accounts`
- Your bank accounts appear in the database

#### **Step 4: Sync Transaction History**
```
1. Click "Sync Account #1" or "Sync Account #2"
2. Downloads recent transactions for that account
3. Creates entries in transactions table
```

**✅ Expected Result:**
- Server logs `POST 200 /api/bank/api/sync/transactions/1`
- Transaction history in database

---

### **Phase 3: Financial Management**

#### **Step 5: View Your Data**
```
1. Go to "View Accounts" → see all connected accounts
2. Go to "View Transactions" → see transaction history
3. Check balances, account types, recent activity
```

#### **Step 6: Budget Management**
```
1. Go to "Manage Budgets"
2. Create budgets by category (food, rent, entertainment)
3. Set monthly limits and track spending
4. Get alerts when approaching limits
```

#### **Step 7: Tax Calculations**
```
1. Go to "Tax Records"
2. Calculate taxes based on your income transactions
3. Generate tax reports for filing
4. Track deductible expenses
```

---

## 🗃️ **Database Tables Used**

| Step | Action | Tables Created/Updated |
|------|--------|----------------------|
| 1 | Connect Bank | `bank_tokens` |
| 3 | Sync Accounts | `financial_accounts` |
| 4 | Sync Transactions | `transactions` |
| 6 | Create Budgets | `budgets` |
| 7 | Tax Calculations | `tax_records` |

---

## 🔧 **Current Setup Issues**

### ✅ **Working:**
- ✅ User registration/login
- ✅ Bank token creation (after datetime fix)
- ✅ All sync API endpoints
- ✅ Authentication middleware
- ✅ Database models

### ❌ **Missing Pages:**
- ❌ `accounts.html` - View bank accounts
- ❌ `transactions.html` - View transaction history  
- ❌ `budgets.html` - Budget management
- ❌ `tax.html` - Tax calculations

### 🔨 **Next Steps:**
1. **Test bank connection** (should work now with datetime fix)
2. **Create missing HTML pages** for viewing data
3. **Add success/error messages** to dashboard forms
4. **Implement data display** pages

---

## 🚀 **Recommended Testing Sequence**

### **Test 1: Basic Connection**
```bash
1. Register/Login user
2. Go to dashboard 
3. Connect bank with "test-token-123"
4. Test connection
```

### **Test 2: Data Sync**
```bash
1. Sync accounts (should create financial_accounts)
2. Sync transactions (should create transactions)  
3. Check database for new records
```

### **Test 3: View Data** (after creating HTML pages)
```bash
1. View accounts page
2. View transactions page
3. Create budgets
4. Calculate taxes
```

---

## 📊 **Sample Test Data**

For testing, your system expects:

```javascript
// Bank Token
{
  provider: "Bank Of America",
  access_token: "test-token-123",
  expires_at: "2025-07-21T23:59:00.000Z"
}

// This should create:
// 1. Bank accounts in financial_accounts
// 2. Transactions in transactions table
// 3. Available for budgeting and tax calculations
```

---

## ⚡ **Quick Fix Priority**

1. **HIGH**: Fix datetime format (✅ Done)
2. **HIGH**: Create accounts.html page 
3. **MEDIUM**: Create transactions.html page
4. **MEDIUM**: Add success/error messages to dashboard
5. **LOW**: Create budgets.html and tax.html pages 