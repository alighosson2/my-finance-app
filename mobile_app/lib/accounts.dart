import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class Account {
  final int id;
  final String accountName;
  final String accountType;
  final double balance;
  final String currency;
  final String accountNumber;
  final String? bankName;
  final String? description;
  final DateTime createdAt;

  Account({
    required this.id,
    required this.accountName,
    required this.accountType,
    required this.balance,
    required this.currency,
    required this.accountNumber,
    this.bankName,
    this.description,
    required this.createdAt,
  });

  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'],
      accountName: json['account_name'] ?? '',
      accountType: json['account_type'] ?? '',
      balance: double.tryParse(json['balance'].toString()) ?? 0.0,
      currency: json['currency'] ?? 'USD',
      accountNumber: json['account_number'] ?? '',
      bankName: json['bank_name'],
      description: json['description'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'account_name': accountName,
      'account_type': accountType,
      'balance': balance,
      'currency': currency,
      'account_number': accountNumber,
      'bank_name': bankName,
      'description': description,
    };
  }
}

class AccountsPage extends StatefulWidget {
  const AccountsPage({super.key});

  @override
  _AccountsPageState createState() => _AccountsPageState();
}

class _AccountsPageState extends State<AccountsPage> {
  List<Account> accounts = [];
  bool isLoading = true;
  String? error;
  final _formKey = GlobalKey<FormState>();
  final _accountNameController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _balanceController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _bankNameController = TextEditingController();
  String _selectedType = 'checking';
  String _selectedCurrency = 'USD';

  @override
  void initState() {
    super.initState();
    fetchAccounts();
  }

  @override
  void dispose() {
    _accountNameController.dispose();
    _accountNumberController.dispose();
    _balanceController.dispose();
    _descriptionController.dispose();
    _bankNameController.dispose();
    super.dispose();
  }

  Future<void> fetchAccounts() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.get(
        Uri.parse('http://localhost:3000/api/financial-accounts'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List accs = data['accounts'] ?? data;
        setState(() {
          accounts = accs.map((json) => Account.fromJson(json)).toList();
          isLoading = false;
        });
      } else {
        setState(() {
          error = 'Failed to load accounts: ${response.body}';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Error: $e';
        isLoading = false;
      });
    }
  }

  Future<void> addAccount() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/financial-accounts'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'account_name': _accountNameController.text,
          'account_type': _selectedType,
          'balance': double.parse(_balanceController.text),
          'currency': _selectedCurrency,
          'account_number': _accountNumberController.text,
          'bank_name': _bankNameController.text.isNotEmpty ? _bankNameController.text : null,
          'description': _descriptionController.text.isNotEmpty ? _descriptionController.text : null,
        }),
      );

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account added successfully!'), backgroundColor: Colors.green),
        );
        _clearForm();
        fetchAccounts(); // Refresh the list
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add account: ${response.body}'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _clearForm() {
    _accountNameController.clear();
    _accountNumberController.clear();
    _balanceController.clear();
    _descriptionController.clear();
    _bankNameController.clear();
    _selectedType = 'checking';
    _selectedCurrency = 'USD';
  }

  String _getAccountTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'checking':
        return '🏦';
      case 'savings':
        return '💰';
      case 'credit':
        return '💳';
      case 'investment':
        return '📈';
      default:
        return '🏛️';
    }
  }

  Color _getBalanceColor(double balance) {
    if (balance > 0) return Colors.green;
    if (balance < 0) return Colors.red;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Financial Accounts'),
        backgroundColor: const Color(0xFF233142),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: fetchAccounts,
          ),
        ],
      ),
      body: Column(
        children: [
          // Add Account Form
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Add New Account', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _accountNameController,
                          decoration: const InputDecoration(
                            labelText: 'Account Name',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextFormField(
                          controller: _accountNumberController,
                          decoration: const InputDecoration(
                            labelText: 'Account Number',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _balanceController,
                          decoration: const InputDecoration(
                            labelText: 'Initial Balance',
                            border: OutlineInputBorder(),
                            prefixText: '\$',
                          ),
                          keyboardType: TextInputType.number,
                          validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedType,
                          decoration: const InputDecoration(
                            labelText: 'Account Type',
                            border: OutlineInputBorder(),
                          ),
                          items: ['checking', 'savings', 'credit', 'investment'].map((type) {
                            return DropdownMenuItem(value: type, child: Text(type.toUpperCase()));
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedType = value!;
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _bankNameController,
                          decoration: const InputDecoration(
                            labelText: 'Bank Name (Optional)',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedCurrency,
                          decoration: const InputDecoration(
                            labelText: 'Currency',
                            border: OutlineInputBorder(),
                          ),
                          items: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((currency) {
                            return DropdownMenuItem(value: currency, child: Text(currency));
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedCurrency = value!;
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(
                      labelText: 'Description (Optional)',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: addAccount,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF20C997),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Add Account'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Accounts List
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : error != null
                    ? Center(child: Text(error!, style: const TextStyle(color: Colors.red)))
                    : accounts.isEmpty
                        ? const Center(child: Text('No accounts found'))
                        : ListView.builder(
                            itemCount: accounts.length,
                            itemBuilder: (context, index) {
                              final account = accounts[index];
                              return Card(
                                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: const Color(0xFF20C997),
                                    child: Text(
                                      _getAccountTypeIcon(account.accountType),
                                      style: const TextStyle(fontSize: 20),
                                    ),
                                  ),
                                  title: Text(account.accountName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('${account.accountType.toUpperCase()} • ${account.accountNumber}'),
                                      if (account.bankName != null) Text('Bank: ${account.bankName}'),
                                    ],
                                  ),
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '${account.currency} ${account.balance.toStringAsFixed(2)}',
                                        style: TextStyle(
                                          color: _getBalanceColor(account.balance),
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      const Text(
                                        'Balance',
                                        style: TextStyle(fontSize: 12, color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
} 