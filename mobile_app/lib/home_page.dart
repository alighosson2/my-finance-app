import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'main.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<Map<String, dynamic>> _accounts = [];
  List<Map<String, dynamic>> _transactions = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      // Load accounts
      final accountsResponse = await http.get(
        Uri.parse('http://localhost:3000/api/accounts/'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (accountsResponse.statusCode == 200) {
        final accountsData = json.decode(accountsResponse.body);
        setState(() => _accounts = List<Map<String, dynamic>>.from(accountsData));
      }
      // Load transactions
      final transactionsResponse = await http.get(
        Uri.parse('http://localhost:3000/api/transactions/'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (transactionsResponse.statusCode == 200) {
        final transactionsData = json.decode(transactionsResponse.body);
        setState(() => _transactions = List<Map<String, dynamic>>.from(transactionsData));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading data: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('MyFinance360'),
        backgroundColor: Colors.blue[800],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadData,
          ),
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () async {
              final prefs = await SharedPreferences.getInstance();
              await prefs.clear();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => WelcomePage()),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Financial Accounts',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  SizedBox(height: 8),
                  _accounts.isEmpty
                      ? Card(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: Text('No accounts found'),
                          ),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: NeverScrollableScrollPhysics(),
                          itemCount: _accounts.length,
                          itemBuilder: (context, index) {
                            final account = _accounts[index];
                            return Card(
                              child: ListTile(
                                title: Text(account['name'] ?? 'Unknown'),
                                subtitle: Text(account['type'] ?? ''),
                                trailing: Text(
                                  '\$${(account['balance'] ?? 0).toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                  SizedBox(height: 24),
                  Text(
                    'Recent Transactions',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  SizedBox(height: 8),
                  _transactions.isEmpty
                      ? Card(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: Text('No transactions found'),
                          ),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: NeverScrollableScrollPhysics(),
                          itemCount: _transactions.length,
                          itemBuilder: (context, index) {
                            final transaction = _transactions[index];
                            return Card(
                              child: ListTile(
                                title: Text(transaction['description'] ?? 'Unknown'),
                                subtitle: Text(transaction['category'] ?? ''),
                                trailing: Text(
                                  '\$${(transaction['amount'] ?? 0).toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: (transaction['amount'] ?? 0) < 0
                                        ? Colors.red
                                        : Colors.green,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
    );
  }
} 