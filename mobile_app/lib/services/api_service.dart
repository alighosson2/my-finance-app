import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Use 10.0.2.2 for Android emulator, localhost for iOS simulator
  static const String baseUrl = 'http://localhost:3000/api';

  static ApiService? _instance;
  static ApiService get instance => _instance ??= ApiService._();

  ApiService._();

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Map<String, String> _getHeaders({bool includeAuth = true}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    return headers;
  }

  Future<Map<String, String>> _getAuthHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<ApiResponse<T>> _handleResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Map<String, dynamic> data = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.success(fromJson(data));
      } else {
        return ApiResponse.error(
          data['message'] ?? 'Unknown error occurred',
          response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse.error('Failed to parse response: $e');
    }
  }

  Future<ApiResponse<List<T>>> _handleListResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>) fromJson,
    String? listKey,
  ) async {
    try {
      final dynamic responseData = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        List<dynamic> items;

        if (responseData is List) {
          // Response is already a list
          items = responseData;
        } else if (responseData is Map<String, dynamic>) {
          // Response is a map, check for the list key
          if (listKey != null && responseData.containsKey(listKey)) {
            final listData = responseData[listKey];
            if (listData is List) {
              items = listData;
            } else {
              // Single item in the list key
              items = [listData];
            }
          } else {
            // Treat the entire map as a single item
            items = [responseData];
          }
        } else {
          // Unexpected response type
          items = [responseData];
        }

        final List<T> result = items
            .map((item) => fromJson(item as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(result);
      } else {
        final Map<String, dynamic> errorData = responseData is Map<String, dynamic>
            ? responseData
            : {'message': 'Unknown error occurred'};
        return ApiResponse.error(
          errorData['message'] ?? 'Unknown error occurred',
          response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse.error('Failed to parse response: $e');
    }
  }

  // Authentication endpoints
  Future<ApiResponse<AuthResponse>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login-api'),
        headers: _getHeaders(includeAuth: false),
        body: json.encode({'email': email, 'password': password}),
      );

      return _handleResponse(response, (data) => AuthResponse.fromJson(data));
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<AuthResponse>> register(Map<String, dynamic> userData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register-api'),
        headers: _getHeaders(includeAuth: false),
        body: json.encode(userData),
      );

      return _handleResponse(response, (data) => AuthResponse.fromJson(data));
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('refreshToken');
  }

  // Account endpoints
  Future<ApiResponse<List<Account>>> getAccounts() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/financial-accounts'),
        headers: await _getAuthHeaders(),
      );

      return _handleListResponse(response, (data) => Account.fromJson(data), 'accounts');
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Account>> createAccount(Map<String, dynamic> accountData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/financial-accounts'),
        headers: await _getAuthHeaders(),
        body: json.encode(accountData),
      );

      return _handleResponse(response, (data) => Account.fromJson(data));
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Account>> updateAccount(int id, Map<String, dynamic> accountData) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/financial-accounts/$id'),
        headers: await _getAuthHeaders(),
        body: json.encode(accountData),
      );

      return _handleResponse(response, (data) => Account.fromJson(data));
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<bool>> deleteAccount(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/financial-accounts/$id'),
        headers: await _getAuthHeaders(),
      );

      return response.statusCode >= 200 && response.statusCode < 300
          ? ApiResponse.success(true)
          : ApiResponse.error('Failed to delete account');
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  // Transaction endpoints
  Future<ApiResponse<List<Transaction>>> getTransactions({
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/transactions?page=$page&limit=$limit'),
        headers: await _getAuthHeaders(),
      );

      return _handleListResponse(response, (data) => Transaction.fromJson(data), 'transactions');
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Transaction>> createTransaction(Map<String, dynamic> transactionData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/transactions'),
        headers: await _getAuthHeaders(),
        body: json.encode(transactionData),
      );

      return _handleResponse(response, (data) => Transaction.fromJson(data));
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  // Budget endpoints
  Future<ApiResponse<List<Budget>>> getBudgets() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/budgets'),
        headers: await _getAuthHeaders(),
      );

      return _handleListResponse(response, (data) => Budget.fromJson(data), 'budgets');
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Budget>> createBudget(Map<String, dynamic> budgetData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/budgets'),
        headers: await _getAuthHeaders(),
        body: json.encode(budgetData),
      );

      return _handleResponse(response, (data) => Budget.fromJson(data));
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  // Bank connection endpoints
  Future<ApiResponse<bool>> connectBank(Map<String, dynamic> bankData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/bank/api/tokens'),
        headers: await _getAuthHeaders(),
        body: json.encode(bankData),
      );

      return response.statusCode >= 200 && response.statusCode < 300
          ? ApiResponse.success(true)
          : ApiResponse.error('Failed to connect bank');
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<bool>> syncBankData(String action) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/bank/api/sync/$action'),
        headers: await _getAuthHeaders(),
      );

      return response.statusCode >= 200 && response.statusCode < 300
          ? ApiResponse.success(true)
          : ApiResponse.error('Failed to sync bank data');
    } catch (e) {
      return ApiResponse.error('Network error: $e');
    }
  }
}

// Response wrapper class
class ApiResponse<T> {
  final T? data;
  final String? error;
  final int? statusCode;
  final bool isSuccess;

  ApiResponse.success(this.data)
      : error = null,
        statusCode = 200,
        isSuccess = true;

  ApiResponse.error(this.error, [this.statusCode])
      : data = null,
        isSuccess = false;
}

// Model classes
class AuthResponse {
  final String token;
  final String refreshToken;
  final Map<String, dynamic>? user;

  AuthResponse({
    required this.token,
    required this.refreshToken,
    this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] ?? json['data']?['token'] ?? '',
      refreshToken: json['refreshToken'] ?? json['data']?['refreshToken'] ?? '',
      user: json['user'] ?? json['data']?['user'],
    );
  }
}

class Account {
  final int? id;
  final String accountName;
  final String accountType;
  final double balance;
  final String currency;
  final String accountNumber;
  final String? bankName;
  final String? description;
  final DateTime? createdAt;

  Account({
    this.id,
    required this.accountName,
    required this.accountType,
    required this.balance,
    required this.currency,
    required this.accountNumber,
    this.bankName,
    this.description,
    this.createdAt,
  });

  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'],
      accountName: json['account_name'] ?? json['accountName'] ?? '',
      accountType: json['account_type'] ?? json['accountType'] ?? '',
      balance: double.tryParse(json['balance'].toString()) ?? 0.0,
      currency: json['currency'] ?? 'USD',
      accountNumber: json['account_number'] ?? json['accountNumber'] ?? '',
      bankName: json['bank_name'] ?? json['bankName'],
      description: json['description'],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
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

class Transaction {
  final int? id;
  final String description;
  final double amount;
  final String date;
  final String category;
  final String transactionType;
  final String? merchantName;
  final int? accountId;

  Transaction({
    this.id,
    required this.description,
    required this.amount,
    required this.date,
    required this.category,
    required this.transactionType,
    this.merchantName,
    this.accountId,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      description: json['description'] ?? '',
      amount: double.tryParse(json['amount'].toString()) ?? 0.0,
      date: json['transaction_date'] ?? json['date'] ?? '',
      category: json['category'] ?? 'Other',
      transactionType: json['transaction_type'] ?? json['type'] ?? 'expense',
      merchantName: json['merchant_name'] ?? json['merchant'],
      accountId: json['account_id'] ?? json['accountId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'description': description,
      'amount': amount,
      'transaction_date': date,
      'category': category,
      'transaction_type': transactionType,
      'merchant_name': merchantName,
      'account_id': accountId,
    };
  }
}

class Budget {
  final int? id;
  final String name;
  final String category;
  final double budgetAmount;
  final double currentSpent;
  final String period;
  final DateTime? startDate;
  final DateTime? endDate;

  Budget({
    this.id,
    required this.name,
    required this.category,
    required this.budgetAmount,
    this.currentSpent = 0.0,
    required this.period,
    this.startDate,
    this.endDate,
  });

  factory Budget.fromJson(Map<String, dynamic> json) {
    return Budget(
      id: json['id'],
      name: json['name'] ?? json['budget_name'] ?? '',
      category: json['category'] ?? '',
      budgetAmount: double.tryParse(json['budget_amount']?.toString() ?? json['amount']?.toString() ?? '0') ?? 0.0,
      currentSpent: double.tryParse(json['current_spent']?.toString() ?? json['spent']?.toString() ?? '0') ?? 0.0,
      period: json['period'] ?? 'monthly',
      startDate: json['start_date'] != null ? DateTime.tryParse(json['start_date']) : null,
      endDate: json['end_date'] != null ? DateTime.tryParse(json['end_date']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'category': category,
      'budget_amount': budgetAmount,
      'period': period,
      'start_date': startDate?.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
    };
  }

  double get remainingAmount => budgetAmount - currentSpent;
  double get progressPercentage => budgetAmount > 0 ? (currentSpent / budgetAmount * 100).clamp(0, 100) : 0;
}
