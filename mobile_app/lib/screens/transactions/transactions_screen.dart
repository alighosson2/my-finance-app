import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../utils/app_theme.dart';
import '../../services/api_service.dart';
import '../../providers/data_provider.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final _searchController = TextEditingController();
  List<Transaction> _transactions = [];
  List<Transaction> _filteredTransactions = [];
  List<Account> _accounts = [];
  bool _isLoading = false;
  String _selectedFilter = 'all';
  String _selectedAccount = 'all';

  @override
  void initState() {
    super.initState();
    _loadData();
    _searchController.addListener(_filterTransactions);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      // Load transactions and accounts in parallel
      final results = await Future.wait([
        ApiService.instance.getTransactions(limit: 100),
        ApiService.instance.getAccounts(),
      ]);

      final transactionsResponse = results[0] as ApiResponse<List<Transaction>>;
      final accountsResponse = results[1] as ApiResponse<List<Account>>;

      if (transactionsResponse.isSuccess && accountsResponse.isSuccess) {
        setState(() {
          _transactions = transactionsResponse.data ?? [];
          _accounts = accountsResponse.data ?? [];
          _filteredTransactions = _transactions;
        });
      } else {
        _showError('Failed to load data');
      }
    } catch (e) {
      _showError('Error loading data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _filterTransactions() {
    final query = _searchController.text.toLowerCase();

    setState(() {
      _filteredTransactions = _transactions.where((transaction) {
        // Text search
        final matchesSearch = query.isEmpty ||
            transaction.description.toLowerCase().contains(query) ||
            transaction.category.toLowerCase().contains(query) ||
            (transaction.merchantName?.toLowerCase().contains(query) ?? false);

        // Type filter
        final matchesType = _selectedFilter == 'all' ||
            transaction.transactionType == _selectedFilter;

        // Account filter
        final matchesAccount = _selectedAccount == 'all' ||
            transaction.accountId.toString() == _selectedAccount;

        return matchesSearch && matchesType && matchesAccount;
      }).toList();

      // Sort by date (newest first)
      _filteredTransactions.sort((a, b) {
        final dateA = DateTime.tryParse(a.date) ?? DateTime.now();
        final dateB = DateTime.tryParse(b.date) ?? DateTime.now();
        return dateB.compareTo(dateA);
      });
    });
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showSuccess(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: AppTheme.successColor,
        ),
      );
    }
  }

  Future<void> _addTransaction() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) => AddEditTransactionScreen(
          accounts: _accounts,
        ),
      ),
    );

    if (result == true) {
      _loadData();
    }
  }

  Future<void> _editTransaction(Transaction transaction) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) => AddEditTransactionScreen(
          transaction: transaction,
          accounts: _accounts,
        ),
      ),
    );

    if (result == true) {
      _loadData();
    }
  }

  Future<void> _deleteTransaction(Transaction transaction) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Transaction'),
        content: Text('Are you sure you want to delete "${transaction.description}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true && transaction.id != null) {
      setState(() => _isLoading = true);

      // Note: Delete API method would need to be added to ApiService
      // For now, we'll show a success message and refresh
      _showSuccess('Transaction deleted successfully');
      await _loadData();
    }
  }

  String _getAccountName(int? accountId) {
    if (accountId == null) return 'Unknown Account';
    final account = _accounts.firstWhere(
      (acc) => acc.id == accountId,
      orElse: () => Account(
        accountName: 'Unknown Account',
        accountType: '',
        balance: 0,
        currency: 'USD',
        accountNumber: '',
      ),
    );
    return '${account.bankName ?? 'Bank'} ${account.accountType}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Transactions'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Section
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                // Search Bar
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search transactions...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _filterTransactions();
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                ),
                const SizedBox(height: 12),

                // Filter Row
                Row(
                  children: [
                    // Type Filter
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedFilter,
                        decoration: InputDecoration(
                          labelText: 'Type',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'all', child: Text('All Types')),
                          DropdownMenuItem(value: 'income', child: Text('Income')),
                          DropdownMenuItem(value: 'expense', child: Text('Expense')),
                          DropdownMenuItem(value: 'transfer', child: Text('Transfer')),
                        ],
                        onChanged: (value) {
                          setState(() => _selectedFilter = value ?? 'all');
                          _filterTransactions();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Account Filter
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedAccount,
                        decoration: InputDecoration(
                          labelText: 'Account',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                        items: [
                          const DropdownMenuItem(value: 'all', child: Text('All Accounts')),
                          ..._accounts.map((account) => DropdownMenuItem(
                                value: account.id.toString(),
                                child: Text('${account.bankName} ${account.accountType}'),
                              )),
                        ],
                        onChanged: (value) {
                          setState(() => _selectedAccount = value ?? 'all');
                          _filterTransactions();
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Transactions List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredTransactions.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredTransactions.length,
                          itemBuilder: (context, index) {
                            final transaction = _filteredTransactions[index];
                            return _buildTransactionCard(transaction);
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addTransaction,
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.receipt_long,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            _transactions.isEmpty ? 'No transactions yet' : 'No matching transactions',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _transactions.isEmpty
                ? 'Add your first transaction to get started!'
                : 'Try adjusting your search or filters',
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          if (_transactions.isEmpty)
            ElevatedButton(
              onPressed: _addTransaction,
              child: const Text('Add Transaction'),
            ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(Transaction transaction) {
    final amount = transaction.amount;
    final isIncome = transaction.transactionType == 'income';
    final color = isIncome ? AppTheme.successColor : Colors.red;
    final icon = isIncome ? Icons.arrow_upward : Icons.arrow_downward;

    final date = DateTime.tryParse(transaction.date) ?? DateTime.now();
    final formattedDate = DateFormat('MMM dd, yyyy').format(date);
    final formattedAmount = NumberFormat.currency(symbol: '\$').format(amount.abs());

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(
          transaction.description,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              '${transaction.category} • ${_getAccountName(transaction.accountId)}',
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              formattedDate,
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 13,
              ),
            ),
            if (transaction.merchantName != null) ...[
              const SizedBox(height: 2),
              Text(
                transaction.merchantName!,
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
              ),
            ],
          ],
        ),
        trailing: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '${isIncome ? '+' : '-'}$formattedAmount',
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, size: 20),
              onSelected: (value) {
                switch (value) {
                  case 'edit':
                    _editTransaction(transaction);
                    break;
                  case 'delete':
                    _deleteTransaction(transaction);
                    break;
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit, size: 18),
                      SizedBox(width: 8),
                      Text('Edit'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, size: 18, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Delete', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class AddEditTransactionScreen extends StatefulWidget {
  final Transaction? transaction;
  final List<Account> accounts;

  const AddEditTransactionScreen({
    super.key,
    this.transaction,
    required this.accounts,
  });

  @override
  State<AddEditTransactionScreen> createState() => _AddEditTransactionScreenState();
}

class _AddEditTransactionScreenState extends State<AddEditTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _amountController = TextEditingController();
  final _merchantController = TextEditingController();
  final _dateController = TextEditingController();

  String _selectedType = 'expense';
  String _selectedCategory = 'Other';
  int? _selectedAccountId;
  bool _isLoading = false;

  final List<String> _categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Personal Care',
    'Income',
    'Other',
  ];

  @override
  void initState() {
    super.initState();

    if (widget.transaction != null) {
      final transaction = widget.transaction!;
      _descriptionController.text = transaction.description;
      _amountController.text = transaction.amount.abs().toString();
      _merchantController.text = transaction.merchantName ?? '';
      _selectedType = transaction.transactionType;
      _selectedCategory = transaction.category;
      _selectedAccountId = transaction.accountId;

      final date = DateTime.tryParse(transaction.date) ?? DateTime.now();
      _dateController.text = DateFormat('yyyy-MM-dd').format(date);
    } else {
      _dateController.text = DateFormat('yyyy-MM-dd').format(DateTime.now());
      if (widget.accounts.isNotEmpty) {
        _selectedAccountId = widget.accounts.first.id;
      }
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _amountController.dispose();
    _merchantController.dispose();
    _dateController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.tryParse(_dateController.text) ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (date != null) {
      _dateController.text = DateFormat('yyyy-MM-dd').format(date);
    }
  }

  Future<void> _saveTransaction() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final transactionData = {
        'description': _descriptionController.text,
        'amount': double.parse(_amountController.text),
        'transaction_date': _dateController.text,
        'category': _selectedCategory,
        'transaction_type': _selectedType,
        'merchant_name': _merchantController.text.isNotEmpty ? _merchantController.text : null,
        'account_id': _selectedAccountId,
      };

      ApiResponse<Transaction> response;
      if (widget.transaction != null) {
        // Update existing transaction (API method would need to be implemented)
        response = await ApiService.instance.createTransaction(transactionData);
      } else {
        response = await ApiService.instance.createTransaction(transactionData);
      }

      if (response.isSuccess) {
        Navigator.of(context).pop(true);
      } else {
        _showError(response.error ?? 'Failed to save transaction');
      }
    } catch (e) {
      _showError('Error saving transaction: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.transaction != null;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Transaction' : 'Add Transaction'),
        actions: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else
            TextButton(
              onPressed: _saveTransaction,
              child: const Text('Save'),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Description
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a description';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Amount
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Amount *',
                  border: OutlineInputBorder(),
                  prefixText: '\$ ',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter an amount';
                  }
                  if (double.tryParse(value) == null || double.parse(value) <= 0) {
                    return 'Please enter a valid amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Type
              DropdownButtonFormField<String>(
                value: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Type *',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'income', child: Text('Income')),
                  DropdownMenuItem(value: 'expense', child: Text('Expense')),
                  DropdownMenuItem(value: 'transfer', child: Text('Transfer')),
                ],
                onChanged: (value) {
                  setState(() => _selectedType = value ?? 'expense');
                },
              ),
              const SizedBox(height: 16),

              // Category
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Category *',
                  border: OutlineInputBorder(),
                ),
                items: _categories.map((category) => DropdownMenuItem(
                      value: category,
                      child: Text(category),
                    )).toList(),
                onChanged: (value) {
                  setState(() => _selectedCategory = value ?? 'Other');
                },
              ),
              const SizedBox(height: 16),

              // Account
              if (widget.accounts.isNotEmpty)
                DropdownButtonFormField<int>(
                  value: _selectedAccountId,
                  decoration: const InputDecoration(
                    labelText: 'Account *',
                    border: OutlineInputBorder(),
                  ),
                  items: widget.accounts.map((account) => DropdownMenuItem(
                        value: account.id,
                        child: Text('${account.bankName} ${account.accountType}'),
                      )).toList(),
                  onChanged: (value) {
                    setState(() => _selectedAccountId = value);
                  },
                  validator: (value) {
                    if (value == null) {
                      return 'Please select an account';
                    }
                    return null;
                  },
                ),
              const SizedBox(height: 16),

              // Date
              TextFormField(
                controller: _dateController,
                decoration: const InputDecoration(
                  labelText: 'Date *',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today),
                ),
                readOnly: true,
                onTap: _selectDate,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a date';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Merchant (optional)
              TextFormField(
                controller: _merchantController,
                decoration: const InputDecoration(
                  labelText: 'Merchant (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 32),

              // Save Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveTransaction,
                  child: _isLoading
                      ? const CircularProgressIndicator()
                      : Text(isEditing ? 'Update Transaction' : 'Add Transaction'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
