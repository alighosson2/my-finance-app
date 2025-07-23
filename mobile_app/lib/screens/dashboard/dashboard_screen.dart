import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/data_provider.dart';
import '../../utils/app_theme.dart';
import '../../services/api_service.dart';
import '../profile/profile_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _providerController = TextEditingController();
  final _accessTokenController = TextEditingController();
  final _tokenSecretController = TextEditingController();
  final _expiresAtController = TextEditingController();

  @override
  void dispose() {
    _providerController.dispose();
    _accessTokenController.dispose();
    _tokenSecretController.dispose();
    _expiresAtController.dispose();
    super.dispose();
  }

  Future<void> _connectBank() async {
    if (_providerController.text.isEmpty || _accessTokenController.text.isEmpty) {
      _showMessage('Please fill in provider and access token', isError: true);
      return;
    }

    final dataProvider = context.read<DataProvider>();
    final success = await dataProvider.connectBank({
      'provider': _providerController.text,
      'access_token': _accessTokenController.text,
      'access_token_secret': _tokenSecretController.text,
      'expires_at': _expiresAtController.text.isNotEmpty
          ? _expiresAtController.text
          : DateTime.now().add(const Duration(days: 30)).toIso8601String(),
    });

    if (success) {
      _showMessage('Bank account connected successfully!');
      _clearBankForm();
    } else {
      _showMessage('Failed to connect bank account', isError: true);
    }
  }

  Future<void> _syncBankData(String action) async {
    final dataProvider = context.read<DataProvider>();
    final success = await dataProvider.syncBankData(action);

    if (success) {
      _showMessage('Bank data synced successfully!');
    } else {
      _showMessage('Failed to sync bank data', isError: true);
    }
  }

  void _clearBankForm() {
    _providerController.clear();
    _accessTokenController.clear();
    _tokenSecretController.clear();
    _expiresAtController.clear();
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : AppTheme.successColor,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Dashboard'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<DataProvider>().loadAllData();
            },
          ),
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              return PopupMenuButton<String>(
                icon: const Icon(Icons.account_circle),
                onSelected: (value) {
                  if (value == 'profile') {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (context) => const ProfileScreen()),
                    );
                  } else if (value == 'logout') {
                    authProvider.logout();
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'profile',
                    child: ListTile(
                      leading: Icon(Icons.person),
                      title: Text('Profile'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'logout',
                    child: ListTile(
                      leading: Icon(Icons.logout),
                      title: Text('Logout'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<DataProvider>().loadAllData(),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              _buildWelcomeSection(),
              const SizedBox(height: 20),

              // Stats Cards
              _buildStatsSection(),
              const SizedBox(height: 20),

              // Bank Connection Section
              _buildBankConnectionSection(),
              const SizedBox(height: 20),

              // Bank Sync Actions
              _buildBankSyncSection(),
              const SizedBox(height: 20),

              // Recent Transactions
              _buildRecentTransactionsSection(),
              const SizedBox(height: 20),

              // Quick Actions
              _buildQuickActionsSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeSection() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.user;
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppTheme.primaryColor, AppTheme.darkColor],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.account_balance_wallet,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back${user != null && user['first_name'] != null ? ', ${user['first_name']}' : ''}!',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Your personal finance dashboard',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.8),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatsSection() {
    return Consumer<DataProvider>(
      builder: (context, dataProvider, child) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Financial Overview',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Total Balance',
                    '\$${NumberFormat('#,##0.00').format(dataProvider.totalBalance)}',
                    Icons.account_balance_wallet,
                    AppTheme.accentColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Accounts',
                    '${dataProvider.accounts.length}',
                    Icons.account_balance,
                    AppTheme.infoColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Monthly Income',
                    '\$${NumberFormat('#,##0.00').format(dataProvider.monthlyIncome)}',
                    Icons.trending_up,
                    AppTheme.successColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Monthly Expenses',
                    '\$${NumberFormat('#,##0.00').format(dataProvider.monthlyExpenses)}',
                    Icons.trending_down,
                    Colors.red,
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 20,
                ),
              ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBankConnectionSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.link, color: AppTheme.accentColor),
                const SizedBox(width: 8),
                Text(
                  'Connect Bank Account',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _providerController,
              decoration: const InputDecoration(
                labelText: 'Bank Provider',
                hintText: 'e.g., Bank Of America',
                prefixIcon: Icon(Icons.business),
              ),
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _accessTokenController,
              decoration: const InputDecoration(
                labelText: 'Access Token',
                hintText: 'Enter your bank API access token',
                prefixIcon: Icon(Icons.key),
              ),
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _tokenSecretController,
              decoration: const InputDecoration(
                labelText: 'Access Token Secret (Optional)',
                hintText: 'Token secret if required',
                prefixIcon: Icon(Icons.lock),
              ),
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _expiresAtController,
              decoration: const InputDecoration(
                labelText: 'Expires At',
                hintText: 'YYYY-MM-DD or leave empty',
                prefixIcon: Icon(Icons.schedule),
              ),
            ),
            const SizedBox(height: 16),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.infoColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info, color: AppTheme.infoColor),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'For Testing: Use access token "test-token-123" and leave expiry empty.',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _connectBank,
                icon: const Icon(Icons.add),
                label: const Text('Connect Bank Account'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBankSyncSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.sync, color: AppTheme.accentColor),
                const SizedBox(width: 8),
                Text(
                  'Bank Data Synchronization',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _buildSyncButton(
                  'Test Connection',
                  Icons.wifi_tethering,
                  AppTheme.warningColor,
                  () => _syncBankData('test'),
                ),
                _buildSyncButton(
                  'Sync Accounts',
                  Icons.account_balance,
                  AppTheme.successColor,
                  () => _syncBankData('accounts'),
                ),
                _buildSyncButton(
                  'Sync Transactions',
                  Icons.swap_horiz,
                  AppTheme.infoColor,
                  () => _syncBankData('transactions'),
                ),
                _buildSyncButton(
                  'Sync All Data',
                  Icons.cloud_sync,
                  AppTheme.primaryColor,
                  () => _syncBankData('all'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSyncButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: color.withOpacity(0.3)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentTransactionsSection() {
    return Consumer<DataProvider>(
      builder: (context, dataProvider, child) {
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.receipt_long, color: AppTheme.accentColor),
                        const SizedBox(width: 8),
                        Text(
                          'Recent Transactions',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    TextButton(
                      onPressed: () {
                        // Navigate to transactions tab
                        // You can implement this with your navigation system
                      },
                      child: const Text('View All'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                if (dataProvider.transactionsLoading)
                  const Center(child: CircularProgressIndicator())
                else if (dataProvider.recentTransactions.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    child: const Center(
                      child: Text(
                        'No transactions yet.\nConnect your bank account to see transactions.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppTheme.textSecondary),
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: dataProvider.recentTransactions.length,
                    separatorBuilder: (context, index) => const Divider(),
                    itemBuilder: (context, index) {
                      final transaction = dataProvider.recentTransactions[index];
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.getTransactionColor(
                              transaction.transactionType,
                              transaction.amount
                            ).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            transaction.transactionType == 'income'
                                ? Icons.trending_up
                                : Icons.trending_down,
                            color: AppTheme.getTransactionColor(
                              transaction.transactionType,
                              transaction.amount
                            ),
                          ),
                        ),
                        title: Text(
                          transaction.description,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(
                          '${transaction.category} • ${DateFormat('MMM dd').format(DateTime.tryParse(transaction.date) ?? DateTime.now())}',
                          style: const TextStyle(color: AppTheme.textSecondary),
                        ),
                        trailing: Text(
                          '\$${NumberFormat('#,##0.00').format(transaction.amount.abs())}',
                          style: TextStyle(
                            color: AppTheme.getTransactionColor(
                              transaction.transactionType,
                              transaction.amount
                            ),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildQuickActionsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.flash_on, color: AppTheme.accentColor),
                const SizedBox(width: 8),
                Text(
                  'Quick Actions',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.5,
              children: [
                _buildQuickActionButton(
                  'View Accounts',
                  Icons.account_balance_wallet,
                  AppTheme.infoColor,
                ),
                _buildQuickActionButton(
                  'Add Transaction',
                  Icons.add_circle,
                  AppTheme.successColor,
                ),
                _buildQuickActionButton(
                  'Manage Budgets',
                  Icons.pie_chart,
                  AppTheme.warningColor,
                ),
                _buildQuickActionButton(
                  'View Reports',
                  Icons.bar_chart,
                  AppTheme.primaryColor,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionButton(String title, IconData icon, Color color) {
    return ElevatedButton(
      onPressed: () {
        // Implement navigation to respective screens
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
