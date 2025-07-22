import 'package:flutter/material.dart';
import 'menu.dart';
import 'responsive.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class Transaction {
  final int id;
  final String description;
  final double amount;
  final String date;
  final String category;

  Transaction(
      {required this.id,
      required this.description,
      required this.amount,
      required this.date,
      required this.category});

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      description: json['description'],
      amount: double.tryParse(json['amount'].toString()) ?? 0.0,
      date: json['transaction_date'] ?? '',
      category: json['category'] ?? '',
    );
  }
}

Future<List<Transaction>> fetchLastTransactions() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  final response = await http.get(
    Uri.parse('http://localhost:3000/api/transactions?page=1&limit=3'),
    headers: {'Authorization': 'Bearer $token'},
  );
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    // If the backend returns { transactions: [...] }, adjust accordingly
    final List txs = data['transactions'] ?? data;
    return txs.map((json) => Transaction.fromJson(json)).toList();
  } else {
    throw Exception('Failed to load transactions');
  }
}

/*
class HomePage extends StatelessWidget {
  HomePage({super.key});

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey();

  @override
  Widget build(BuildContext context) {
    final Color backgroundColor = Color(0xFF233142); // Sidebar background
    final Color highlightColor = Color(0xFF3A506B); // Selected menu item
    final Color mainBgColor = Color(0xFFF7F9FA); // Main content background
    final Color accentColor = Color(0xFF20C997); // Project teal
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: mainBgColor,
      drawer: !Responsive.isDesktop(context)
          ? SizedBox(
              width: 250,
              child: Menu(
                scaffoldKey: _scaffoldKey,
                backgroundColor: backgroundColor,
                highlightColor: highlightColor,
              ),
            )
          : null,
      body: SafeArea(
        child: Row(
          children: [
            if (Responsive.isDesktop(context))
              Container(
                width: 250,
                height: double.infinity,
                color: backgroundColor,
                child: Menu(
                  scaffoldKey: _scaffoldKey,
                  backgroundColor: backgroundColor,
                  highlightColor: highlightColor,
                ),
              ),
            Expanded(
              child: Container(
                color: mainBgColor,
                child: Center(
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(height: 40),
                        Icon(Icons.show_chart, size: 48, color: accentColor),
                        SizedBox(height: 16),
                        Text(
                          'Welcome to MyFinance360',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF22223B),
                            fontFamily: 'Roboto',
                          ),
                        ),
                        SizedBox(height: 8),
                        Container(
                          width: 80,
                          height: 4,
                          decoration: BoxDecoration(
                            color: accentColor,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        SizedBox(height: 24),
                        Text(
                          'Your personal finance dashboard',
                          style: TextStyle(
                            fontSize: 16,
                            color: Color(0xFF6C757D),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: 40),
                        // --- Forms Container ---
                        Container(
                          width: 600,
                          padding: EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 24,
                                offset: Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.account_balance, color: accentColor, size: 28),
                                  SizedBox(width: 8),
                                  Text(
                                    'Connect Bank Account',
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF233142),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 24),
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Bank Provider'),
                                        SizedBox(height: 8),
                                        TextField(
                                          decoration: InputDecoration(
                                            hintText: 'e.g., Bank Of America',
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                          ),
                                        ),
                                        SizedBox(height: 4),
                                        Text('Enter your bank name', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                  SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Access Token'),
                                        SizedBox(height: 8),
                                        TextField(
                                          decoration: InputDecoration(
                                            hintText: 'Enter your bank API access token',
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                          ),
                                        ),
                                        SizedBox(height: 4),
                                        Text('For testing, use: test-token-123', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Access Token Secret (Optional)'),
                                        SizedBox(height: 8),
                                        TextField(
                                          decoration: InputDecoration(
                                            hintText: 'Token secret if required',
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Expires At'),
                                        SizedBox(height: 8),
                                        TextField(
                                          decoration: InputDecoration(
                                            hintText: 'mm/dd/yyyy --:-- --',
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                            suffixIcon: Icon(Icons.calendar_today, size: 20),
                                          ),
                                        ),
                                        SizedBox(height: 4),
                                        Text('When this token expires', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 20),
                              Container(
                                width: double.infinity,
                                padding: EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Color(0xFFB2F0F7),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.info_outline, color: accentColor),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'For Testing: Use access token "test-token-123" and set expiry to tomorrow\'s date.',
                                        style: TextStyle(fontSize: 15, color: Color(0xFF233142)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(height: 20),
                              SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: ElevatedButton(
                                  onPressed: () {},
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: accentColor,
                                    foregroundColor: Colors.white,
                                    textStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  child: Text('+ Connect Bank Account'),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // --- End Forms Container ---
                        SizedBox(height: 60),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
*/
class HomePage extends StatelessWidget {
  HomePage({super.key});

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey();
  final _providerController = TextEditingController();
  final _accessTokenController = TextEditingController();
  final _tokenSecretController = TextEditingController();
  final _expiresAtController = TextEditingController();

  Future<void> connectBankAccount(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final response = await http.post(
      Uri.parse('http://localhost:3000/api/bank/connect'), // Adjust endpoint if needed
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'provider': _providerController.text,
        'access_token': _accessTokenController.text,
        'access_token_secret': _tokenSecretController.text,
        'expires_at': _expiresAtController.text,
      }),
    );
    if (response.statusCode == 201) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bank account connected!'), backgroundColor: Colors.green),
      );
      // Optionally clear the form
      _providerController.clear();
      _accessTokenController.clear();
      _tokenSecretController.clear();
      _expiresAtController.clear();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to connect bank: ${response.body}'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final Color backgroundColor = Color(0xFF233142); // Sidebar background
    final Color highlightColor = Color(0xFF3A506B); // Selected menu item
    final Color mainBgColor = Color(0xFFF7F9FA); // Main content background
    final Color accentColor = Color(0xFF20C997); // Project teal

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: mainBgColor,
      appBar: !Responsive.isDesktop(context)
          ? AppBar(
              backgroundColor: backgroundColor,
              title: Text('MyFinance360'),
              leading: IconButton(
                icon: Icon(Icons.menu),
                onPressed: () => _scaffoldKey.currentState?.openDrawer(),
              ),
            )
          : null,
      drawer: !Responsive.isDesktop(context)
          ? SizedBox(
              width: 300,
              child: Menu(
                scaffoldKey: _scaffoldKey,
                backgroundColor: backgroundColor,
                highlightColor: highlightColor,
              ),
            )
          : null,
      body: SafeArea(
        child: Row(
          children: [
            // Sidebar for desktop
            if (Responsive.isDesktop(context))
              Container(
                width: 250,
                height: double.infinity,
                color: backgroundColor,
                child: Menu(
                  scaffoldKey: _scaffoldKey,
                  backgroundColor: backgroundColor,
                  highlightColor: highlightColor,
                ),
              ),
            // Main content area
            Expanded(
              child: Container(
                color: mainBgColor,
                child: Center(
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(height: 40),
                        Icon(Icons.show_chart, size: 48, color: accentColor),
                        SizedBox(height: 16),
                        Text(
                          'Welcome to MyFinance360',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF22223B),
                            fontFamily: 'Roboto',
                          ),
                        ),
                        SizedBox(height: 8),
                        Container(
                          width: 80,
                          height: 4,
                          decoration: BoxDecoration(
                            color: accentColor,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        SizedBox(height: 24),
                        Text(
                          'Your personal finance dashboard',
                          style: TextStyle(
                            fontSize: 16,
                            color: Color(0xFF6C757D),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: 40),
                        // --- Forms Container ---
                        Container(
                          width: Responsive.isMobile(context)
                              ? MediaQuery.of(context).size.width * 0.9
                              : 600,
                          padding: EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 24,
                                offset: Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.account_balance,
                                    color: accentColor,
                                    size: 28,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'Connect Bank Account',
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF233142),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 24),
                              // Responsive layout for form fields
                              if (Responsive.isMobile(context)) ...[
                                // Mobile layout - vertical
                                Column(
                                  children: [
                                    _buildBankProviderField(),
                                    SizedBox(height: 16),
                                    _buildAccessTokenField(),
                                    SizedBox(height: 16),
                                    _buildTokenSecretField(),
                                    SizedBox(height: 16),
                                    _buildExpiresAtField(),
                                  ],
                                ),
                              ] else ...[
                                // Desktop/tablet layout - horizontal
                                Row(
                                  children: [
                                    Expanded(child: _buildBankProviderField()),
                                    SizedBox(width: 16),
                                    Expanded(child: _buildAccessTokenField()),
                                  ],
                                ),
                                SizedBox(height: 16),
                                Row(
                                  children: [
                                    Expanded(child: _buildTokenSecretField()),
                                    SizedBox(width: 16),
                                    Expanded(child: _buildExpiresAtField()),
                                  ],
                                ),
                              ],
                              SizedBox(height: 20),
                              Container(
                                width: double.infinity,
                                padding: EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Color(0xFFB2F0F7),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.info_outline,
                                      color: accentColor,
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'For Testing: Use access token "test-token-123" and set expiry to tomorrow\'s date.',
                                        style: TextStyle(
                                          fontSize: 15,
                                          color: Color(0xFF233142),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(height: 20),
                              SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: ElevatedButton(
                                  onPressed: () => connectBankAccount(context),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: accentColor,
                                    foregroundColor: Colors.white,
                                    textStyle: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  child: Text('+ Connect Bank Account'),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // --- End Forms Container ---
                        SizedBox(height: 32),
                        Container(
                          width: 600,
                          padding: EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 16,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.list_alt,
                                      color: accentColor, size: 24),
                                  SizedBox(width: 8),
                                  Text('Recent Transactions',
                                      style: TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF233142))),
                                ],
                              ),
                              SizedBox(height: 16),
                              FutureBuilder<List<Transaction>>(
                                future: fetchLastTransactions(),
                                builder: (context, snapshot) {
                                  if (snapshot.connectionState ==
                                      ConnectionState.waiting) {
                                    return Center(
                                        child: CircularProgressIndicator());
                                  } else if (snapshot.hasError) {
                                    return Text('Error: ${snapshot.error}',
                                        style: TextStyle(color: Colors.red));
                                  } else if (!snapshot.hasData ||
                                      snapshot.data!.isEmpty) {
                                    return Text('No transactions found.');
                                  }
                                  final txs = snapshot.data!;
                                  return ListView.separated(
                                    shrinkWrap: true,
                                    physics: NeverScrollableScrollPhysics(),
                                    itemCount: txs.length,
                                    separatorBuilder: (context, i) => Divider(),
                                    itemBuilder: (context, i) {
                                      final tx = txs[i];
                                      return ListTile(
                                        leading: Icon(Icons.monetization_on,
                                            color: accentColor),
                                        title: Text(tx.description,
                                            style: TextStyle(
                                                fontWeight: FontWeight.bold)),
                                        subtitle: Text(
                                            '${tx.category} • ${tx.date.substring(0, 10)}'),
                                        trailing: Text(
                                            '${tx.amount.toStringAsFixed(2)}',
                                            style: TextStyle(
                                                color: tx.amount < 0
                                                    ? Colors.red
                                                    : Colors.green,
                                                fontWeight: FontWeight.bold)),
                                      );
                                    },
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 60),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Helper methods for form fields
  Widget _buildBankProviderField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Bank Provider'),
        SizedBox(height: 8),
        TextField(
          controller: _providerController,
          decoration: InputDecoration(
            hintText: 'e.g., Bank Of America',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
        ),
        SizedBox(height: 4),
        Text(
          'Enter your bank name',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildAccessTokenField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Access Token'),
        SizedBox(height: 8),
        TextField(
          controller: _accessTokenController,
          decoration: InputDecoration(
            hintText: 'Enter your bank API access token',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
        ),
        SizedBox(height: 4),
        Text(
          'For testing, use: test-token-123',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildTokenSecretField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Access Token Secret (Optional)'),
        SizedBox(height: 8),
        TextField(
          controller: _tokenSecretController,
          decoration: InputDecoration(
            hintText: 'Token secret if required',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
        ),
      ],
    );
  }

  Widget _buildExpiresAtField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Expires At'),
        SizedBox(height: 8),
        TextField(
          controller: _expiresAtController,
          decoration: InputDecoration(
            hintText: 'mm/dd/yyyy --:-- --',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            suffixIcon: Icon(Icons.calendar_today, size: 20),
          ),
        ),
        SizedBox(height: 4),
        Text(
          'When this token expires',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }
}
