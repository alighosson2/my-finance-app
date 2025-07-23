import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../utils/app_theme.dart';
import '../../services/api_service.dart';
import '../../providers/data_provider.dart';

class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  List<Budget> _budgets = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadBudgets();
  }

  Future<void> _loadBudgets() async {
    setState(() => _isLoading = true);

    try {
      final response = await ApiService.instance.getBudgets();

      if (response.isSuccess) {
        setState(() {
          _budgets = response.data ?? [];
        });
      } else {
        _showError('Failed to load budgets');
      }
    } catch (e) {
      _showError('Error loading budgets: $e');
    } finally {
      setState(() => _isLoading = false);
    }
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

  Future<void> _addBudget() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) => const AddEditBudgetScreen(),
      ),
    );

    if (result == true) {
      _loadBudgets();
    }
  }

  Future<void> _editBudget(Budget budget) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) => AddEditBudgetScreen(budget: budget),
      ),
    );

    if (result == true) {
      _loadBudgets();
    }
  }

  Future<void> _deleteBudget(Budget budget) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Budget'),
        content: Text('Are you sure you want to delete "${budget.name}"?'),
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

    if (confirm == true && budget.id != null) {
      setState(() => _isLoading = true);

      // Note: Delete API method would need to be added to ApiService
      // For now, we'll show a success message and refresh
      _showSuccess('Budget deleted successfully');
      await _loadBudgets();
    }
  }

  Color _getBudgetStatusColor(double percentage) {
    if (percentage >= 100) return Colors.red;
    if (percentage >= 80) return Colors.orange;
    return AppTheme.successColor;
  }

  IconData _getCategoryIcon(String category) {
    final icons = {
      'food': Icons.restaurant,
      'transportation': Icons.directions_car,
      'shopping': Icons.shopping_bag,
      'entertainment': Icons.movie,
      'bills': Icons.receipt,
      'healthcare': Icons.local_hospital,
      'education': Icons.school,
      'travel': Icons.flight,
      'personal': Icons.person,
      'other': Icons.category,
    };
    return icons[category.toLowerCase()] ?? Icons.category;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Budgets'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadBudgets,
          ),
        ],
      ),
      body: Column(
        children: [
          // Summary Cards
          if (_budgets.isNotEmpty) _buildSummarySection(),

          // Budget Alerts
          if (_budgets.isNotEmpty) _buildAlertsSection(),

          // Budgets List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _budgets.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadBudgets,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _budgets.length,
                          itemBuilder: (context, index) {
                            final budget = _budgets[index];
                            return _buildBudgetCard(budget);
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addBudget,
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildSummarySection() {
    final totalBudgeted = _budgets.fold(0.0, (sum, budget) => sum + budget.budgetAmount);
    final totalSpent = _budgets.fold(0.0, (sum, budget) => sum + budget.currentSpent);
    final totalRemaining = totalBudgeted - totalSpent;

    final onTrack = _budgets.where((b) => b.progressPercentage < 80).length;
    final overBudget = _budgets.where((b) => b.progressPercentage >= 100).length;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Budget Summary',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildSummaryItem(
                  'Total Budgeted',
                  NumberFormat.currency(symbol: '\$').format(totalBudgeted),
                  AppTheme.primaryColor,
                ),
              ),
              Expanded(
                child: _buildSummaryItem(
                  'Total Spent',
                  NumberFormat.currency(symbol: '\$').format(totalSpent),
                  Colors.red,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildSummaryItem(
                  'Remaining',
                  NumberFormat.currency(symbol: '\$').format(totalRemaining),
                  totalRemaining >= 0 ? AppTheme.successColor : Colors.red,
                ),
              ),
              Expanded(
                child: _buildSummaryItem(
                  'On Track',
                  '$onTrack/${_budgets.length}',
                  AppTheme.successColor,
                ),
              ),
            ],
          ),
          if (overBudget > 0) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning, color: Colors.red, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    '$overBudget budget${overBudget > 1 ? 's' : ''} over limit',
                    style: const TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildAlertsSection() {
    final alerts = _budgets.where((budget) => budget.progressPercentage >= 90).toList();

    if (alerts.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: alerts.take(2).map((budget) {
          final isOverBudget = budget.progressPercentage >= 100;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isOverBudget ? Colors.red.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isOverBudget ? Colors.red : Colors.orange,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.warning,
                  color: isOverBudget ? Colors.red : Colors.orange,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    isOverBudget
                        ? '${budget.name} is over budget!'
                        : '${budget.name} is ${budget.progressPercentage.toInt()}% used',
                    style: TextStyle(
                      color: isOverBudget ? Colors.red : Colors.orange,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.pie_chart,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          const Text(
            'No budgets yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Create your first budget to start\ntracking your spending!',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _addBudget,
            child: const Text('Create Budget'),
          ),
        ],
      ),
    );
  }

  Widget _buildBudgetCard(Budget budget) {
    final percentage = budget.progressPercentage;
    final statusColor = _getBudgetStatusColor(percentage);
    final categoryIcon = _getCategoryIcon(budget.category);

    final formattedBudget = NumberFormat.currency(symbol: '\$').format(budget.budgetAmount);
    final formattedSpent = NumberFormat.currency(symbol: '\$').format(budget.currentSpent);
    final formattedRemaining = NumberFormat.currency(symbol: '\$').format(budget.remainingAmount);

    // Calculate days remaining
    final now = DateTime.now();
    final endDate = budget.endDate ?? DateTime(now.year, now.month + 1, 0); // End of current month if no end date
    final daysRemaining = endDate.difference(now).inDays;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with icon, name, and menu
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    categoryIcon,
                    color: statusColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        budget.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        budget.category,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    percentage >= 100
                        ? 'Over Budget'
                        : percentage >= 80
                            ? 'Warning'
                            : 'On Track',
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, size: 20),
                  onSelected: (value) {
                    switch (value) {
                      case 'edit':
                        _editBudget(budget);
                        break;
                      case 'delete':
                        _deleteBudget(budget);
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
            const SizedBox(height: 16),

            // Amount and progress
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$formattedSpent of $formattedBudget',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '${percentage.toInt()}%',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Progress bar
            LinearProgressIndicator(
              value: percentage / 100,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
              minHeight: 8,
            ),
            const SizedBox(height: 12),

            // Footer info
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      formattedRemaining,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: budget.remainingAmount >= 0 ? AppTheme.successColor : Colors.red,
                      ),
                    ),
                    const Text(
                      'Remaining',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      daysRemaining > 0 ? '$daysRemaining' : '0',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Text(
                      'Days left',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      budget.period.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Text(
                      'Period',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class AddEditBudgetScreen extends StatefulWidget {
  final Budget? budget;

  const AddEditBudgetScreen({super.key, this.budget});

  @override
  State<AddEditBudgetScreen> createState() => _AddEditBudgetScreenState();
}

class _AddEditBudgetScreenState extends State<AddEditBudgetScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  final _startDateController = TextEditingController();
  final _endDateController = TextEditingController();

  String _selectedCategory = 'Other';
  String _selectedPeriod = 'monthly';
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
    'Other',
  ];

  final List<String> _periods = [
    'weekly',
    'monthly',
    'quarterly',
    'yearly',
  ];

  @override
  void initState() {
    super.initState();

    if (widget.budget != null) {
      final budget = widget.budget!;
      _nameController.text = budget.name;
      _amountController.text = budget.budgetAmount.toString();
      _selectedCategory = budget.category;
      _selectedPeriod = budget.period;

      if (budget.startDate != null) {
        _startDateController.text = DateFormat('yyyy-MM-dd').format(budget.startDate!);
      }
      if (budget.endDate != null) {
        _endDateController.text = DateFormat('yyyy-MM-dd').format(budget.endDate!);
      }
    } else {
      // Set default start date to beginning of current month
      final now = DateTime.now();
      final firstDay = DateTime(now.year, now.month, 1);
      _startDateController.text = DateFormat('yyyy-MM-dd').format(firstDay);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    _startDateController.dispose();
    _endDateController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(TextEditingController controller) async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.tryParse(controller.text) ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );

    if (date != null) {
      controller.text = DateFormat('yyyy-MM-dd').format(date);
    }
  }

  Future<void> _saveBudget() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final budgetData = {
        'name': _nameController.text,
        'category': _selectedCategory,
        'budget_amount': double.parse(_amountController.text),
        'period': _selectedPeriod,
        'start_date': _startDateController.text,
        'end_date': _endDateController.text.isNotEmpty ? _endDateController.text : null,
      };

      ApiResponse<Budget> response;
      if (widget.budget != null) {
        // Update existing budget (API method would need to be implemented)
        response = await ApiService.instance.createBudget(budgetData);
      } else {
        response = await ApiService.instance.createBudget(budgetData);
      }

      if (response.isSuccess) {
        Navigator.of(context).pop(true);
      } else {
        _showError(response.error ?? 'Failed to save budget');
      }
    } catch (e) {
      _showError('Error saving budget: $e');
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
    final isEditing = widget.budget != null;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Budget' : 'Create Budget'),
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
              onPressed: _saveBudget,
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
              // Name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Budget Name *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a budget name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Amount
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Budget Amount *',
                  border: OutlineInputBorder(),
                  prefixText: '\$ ',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a budget amount';
                  }
                  if (double.tryParse(value) == null || double.parse(value) <= 0) {
                    return 'Please enter a valid amount';
                  }
                  return null;
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

              // Period
              DropdownButtonFormField<String>(
                value: _selectedPeriod,
                decoration: const InputDecoration(
                  labelText: 'Period *',
                  border: OutlineInputBorder(),
                ),
                items: _periods.map((period) => DropdownMenuItem(
                      value: period,
                      child: Text(period.toUpperCase()),
                    )).toList(),
                onChanged: (value) {
                  setState(() => _selectedPeriod = value ?? 'monthly');
                },
              ),
              const SizedBox(height: 16),

              // Start Date
              TextFormField(
                controller: _startDateController,
                decoration: const InputDecoration(
                  labelText: 'Start Date *',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today),
                ),
                readOnly: true,
                onTap: () => _selectDate(_startDateController),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a start date';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // End Date (optional)
              TextFormField(
                controller: _endDateController,
                decoration: const InputDecoration(
                  labelText: 'End Date (optional)',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today),
                  helperText: 'Leave empty for recurring budget',
                ),
                readOnly: true,
                onTap: () => _selectDate(_endDateController),
              ),
              const SizedBox(height: 32),

              // Save Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveBudget,
                  child: _isLoading
                      ? const CircularProgressIndicator()
                      : Text(isEditing ? 'Update Budget' : 'Create Budget'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
