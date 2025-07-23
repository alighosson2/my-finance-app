import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class DataProvider with ChangeNotifier {
  // Accounts
  List<Account> _accounts = [];
  bool _accountsLoading = false;
  String? _accountsError;

  // Transactions
  List<Transaction> _transactions = [];
  bool _transactionsLoading = false;
  String? _transactionsError;

  // Budgets
  List<Budget> _budgets = [];
  bool _budgetsLoading = false;
  String? _budgetsError;

  // Dashboard stats
  double _totalBalance = 0.0;
  double _monthlyIncome = 0.0;
  double _monthlyExpenses = 0.0;

  // Getters
  List<Account> get accounts => _accounts;
  bool get accountsLoading => _accountsLoading;
  String? get accountsError => _accountsError;

  List<Transaction> get transactions => _transactions;
  bool get transactionsLoading => _transactionsLoading;
  String? get transactionsError => _transactionsError;

  List<Budget> get budgets => _budgets;
  bool get budgetsLoading => _budgetsLoading;
  String? get budgetsError => _budgetsError;

  double get totalBalance => _totalBalance;
  double get monthlyIncome => _monthlyIncome;
  double get monthlyExpenses => _monthlyExpenses;

  // Recent transactions for dashboard
  List<Transaction> get recentTransactions =>
      _transactions.take(5).toList();

  // Account Methods
  Future<void> fetchAccounts() async {
    _accountsLoading = true;
    _accountsError = null;
    notifyListeners();

    try {
      final response = await ApiService.instance.getAccounts();
      if (response.isSuccess) {
        _accounts = response.data ?? [];
        _calculateTotalBalance();
      } else {
        _accountsError = response.error;
      }
    } catch (e) {
      _accountsError = 'Failed to load accounts: $e';
    }

    _accountsLoading = false;
    notifyListeners();
  }

  Future<bool> createAccount(Account account) async {
    try {
      final response = await ApiService.instance.createAccount(account.toJson());
      if (response.isSuccess && response.data != null) {
        _accounts.add(response.data!);
        _calculateTotalBalance();
        notifyListeners();
        return true;
      } else {
        _accountsError = response.error;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _accountsError = 'Failed to create account: $e';
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateAccount(int id, Account account) async {
    try {
      final response = await ApiService.instance.updateAccount(id, account.toJson());
      if (response.isSuccess && response.data != null) {
        final index = _accounts.indexWhere((a) => a.id == id);
        if (index != -1) {
          _accounts[index] = response.data!;
          _calculateTotalBalance();
          notifyListeners();
        }
        return true;
      } else {
        _accountsError = response.error;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _accountsError = 'Failed to update account: $e';
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteAccount(int id) async {
    try {
      final response = await ApiService.instance.deleteAccount(id);
      if (response.isSuccess) {
        _accounts.removeWhere((account) => account.id == id);
        _calculateTotalBalance();
        notifyListeners();
        return true;
      } else {
        _accountsError = response.error;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _accountsError = 'Failed to delete account: $e';
      notifyListeners();
      return false;
    }
  }

  // Transaction Methods
  Future<void> fetchTransactions() async {
    _transactionsLoading = true;
    _transactionsError = null;
    notifyListeners();

    try {
      final response = await ApiService.instance.getTransactions();
      if (response.isSuccess) {
        _transactions = response.data ?? [];
        _calculateMonthlyStats();
      } else {
        _transactionsError = response.error;
      }
    } catch (e) {
      _transactionsError = 'Failed to load transactions: $e';
    }

    _transactionsLoading = false;
    notifyListeners();
  }

  Future<bool> createTransaction(Transaction transaction) async {
    try {
      final response = await ApiService.instance.createTransaction(transaction.toJson());
      if (response.isSuccess && response.data != null) {
        _transactions.insert(0, response.data!); // Add to beginning for recent view
        _calculateMonthlyStats();
        notifyListeners();
        return true;
      } else {
        _transactionsError = response.error;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _transactionsError = 'Failed to create transaction: $e';
      notifyListeners();
      return false;
    }
  }

  // Budget Methods
  Future<void> fetchBudgets() async {
    _budgetsLoading = true;
    _budgetsError = null;
    notifyListeners();

    try {
      final response = await ApiService.instance.getBudgets();
      if (response.isSuccess) {
        _budgets = response.data ?? [];
      } else {
        _budgetsError = response.error;
      }
    } catch (e) {
      _budgetsError = 'Failed to load budgets: $e';
    }

    _budgetsLoading = false;
    notifyListeners();
  }

  Future<bool> createBudget(Budget budget) async {
    try {
      final response = await ApiService.instance.createBudget(budget.toJson());
      if (response.isSuccess && response.data != null) {
        _budgets.add(response.data!);
        notifyListeners();
        return true;
      } else {
        _budgetsError = response.error;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _budgetsError = 'Failed to create budget: $e';
      notifyListeners();
      return false;
    }
  }

  // Bank Integration Methods
  Future<bool> connectBank(Map<String, dynamic> bankData) async {
    try {
      final response = await ApiService.instance.connectBank(bankData);
      if (response.isSuccess) {
        // Refresh accounts after successful bank connection
        await fetchAccounts();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Failed to connect bank: $e');
      return false;
    }
  }

  Future<bool> syncBankData(String action) async {
    try {
      final response = await ApiService.instance.syncBankData(action);
      if (response.isSuccess) {
        // Refresh data after sync
        await Future.wait([
          fetchAccounts(),
          fetchTransactions(),
        ]);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Failed to sync bank data: $e');
      return false;
    }
  }

  // Load all data
  Future<void> loadAllData() async {
    await Future.wait([
      fetchAccounts(),
      fetchTransactions(),
      fetchBudgets(),
    ]);
  }

  // Private helper methods
  void _calculateTotalBalance() {
    _totalBalance = _accounts.fold(0.0, (sum, account) => sum + account.balance);
  }

  void _calculateMonthlyStats() {
    final now = DateTime.now();
    final firstDayOfMonth = DateTime(now.year, now.month, 1);

    final thisMonthTransactions = _transactions.where((tx) {
      final txDate = DateTime.tryParse(tx.date);
      return txDate != null && txDate.isAfter(firstDayOfMonth);
    }).toList();

    _monthlyIncome = thisMonthTransactions
        .where((tx) => tx.transactionType == 'income')
        .fold(0.0, (sum, tx) => sum + tx.amount);

    _monthlyExpenses = thisMonthTransactions
        .where((tx) => tx.transactionType == 'expense')
        .fold(0.0, (sum, tx) => sum + tx.amount.abs());
  }

  void clearErrors() {
    _accountsError = null;
    _transactionsError = null;
    _budgetsError = null;
    notifyListeners();
  }
}
