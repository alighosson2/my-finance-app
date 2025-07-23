import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _token;
  String? _refreshToken;
  Map<String, dynamic>? _user;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  String? get error => _error;

  Future<void> checkAuthStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('token');
      _refreshToken = prefs.getString('refreshToken');

      if (_token != null && _refreshToken != null) {
        _isAuthenticated = true;
        // You might want to validate the token with the server here
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error checking auth status: $e');
    }
  }

  Future<bool> login(String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      final response = await ApiService.instance.login(email, password);

      if (response.isSuccess && response.data != null) {
        final authData = response.data!;
        _token = authData.token;
        _refreshToken = authData.refreshToken;
        _user = authData.user;
        _isAuthenticated = true;

        // Store tokens in SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('refreshToken', _refreshToken!);

        _setLoading(false);
        return true;
      } else {
        _error = response.error ?? 'Login failed';
        _setLoading(false);
        return false;
      }
    } catch (e) {
      _error = 'Network error: $e';
      _setLoading(false);
      return false;
    }
  }

  Future<bool> register(Map<String, dynamic> userData) async {
    _setLoading(true);
    _clearError();

    try {
      final response = await ApiService.instance.register(userData);

      if (response.isSuccess && response.data != null) {
        final authData = response.data!;
        _token = authData.token;
        _refreshToken = authData.refreshToken;
        _user = authData.user;
        _isAuthenticated = true;

        // Store tokens in SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('refreshToken', _refreshToken!);

        _setLoading(false);
        return true;
      } else {
        _error = response.error ?? 'Registration failed';
        _setLoading(false);
        return false;
      }
    } catch (e) {
      _error = 'Network error: $e';
      _setLoading(false);
      return false;
    }
  }

  Future<void> logout() async {
    await ApiService.instance.logout();
    _token = null;
    _refreshToken = null;
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }
}
