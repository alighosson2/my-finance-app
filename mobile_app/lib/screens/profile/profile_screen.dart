import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: AppTheme.primaryColor,
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.user;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Profile Header
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: AppTheme.accentColor.withOpacity(0.1),
                          child: Text(
                            user != null && user['first_name'] != null
                                ? user['first_name'][0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.accentColor,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          user != null
                              ? '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}'.trim()
                              : 'User',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                        const SizedBox(height: 8),
                        if (user?['email'] != null)
                          Text(
                            user!['email'],
                            style: const TextStyle(
                              fontSize: 16,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Menu Items
                Card(
                  child: Column(
                    children: [
                      _buildMenuItem(
                        context,
                        Icons.person,
                        'Account Settings',
                        'Manage your account information',
                        () {
                          // TODO: Navigate to account settings
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        Icons.security,
                        'Security',
                        'Change password and security settings',
                        () {
                          // TODO: Navigate to security settings
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        Icons.notifications,
                        'Notifications',
                        'Manage notification preferences',
                        () {
                          // TODO: Navigate to notification settings
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        Icons.help,
                        'Help & Support',
                        'Get help and support',
                        () {
                          // TODO: Navigate to help
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        Icons.info,
                        'About',
                        'App version and information',
                        () {
                          _showAboutDialog(context);
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Logout Button
                Card(
                  child: _buildMenuItem(
                    context,
                    Icons.logout,
                    'Logout',
                    'Sign out of your account',
                    () {
                      _showLogoutDialog(context);
                    },
                    isDestructive: true,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap, {
    bool isDestructive = false,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isDestructive
              ? Colors.red.withOpacity(0.1)
              : AppTheme.accentColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          color: isDestructive ? Colors.red : AppTheme.accentColor,
          size: 20,
        ),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: isDestructive ? Colors.red : AppTheme.primaryColor,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          color: AppTheme.textSecondary,
          fontSize: 14,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
      onTap: onTap,
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              context.read<AuthProvider>().logout();
            },
            child: const Text('Logout', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About MyFinance360'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Version: 1.0.0'),
            SizedBox(height: 8),
            Text('MyFinance360 is a comprehensive personal finance management application that helps you track expenses, manage budgets, and achieve your financial goals.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
