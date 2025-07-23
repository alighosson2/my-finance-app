import 'package:flutter/material.dart';
// import 'package:flutter_svg/svg.dart'; // Commented out SVG for fallback to Material icons
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../login_page.dart';
import '../transactions.dart';
import '../accounts.dart';
import '../budget.dart';
import '../taxrecords.dart';

class Menu extends StatefulWidget {
  final GlobalKey<ScaffoldState> scaffoldKey;
  final Color? backgroundColor;
  final Color? highlightColor;

  const Menu(
      {super.key,
      required this.scaffoldKey,
      this.backgroundColor,
      this.highlightColor});

  @override
  _MenuState createState() => _MenuState();
}

class MenuItemData {
  final IconData icon;
  final String title;
  MenuItemData({required this.icon, required this.title});
}

class _MenuState extends State<Menu> {
  final List<MenuItemData> menu = [
    MenuItemData(icon: Icons.dashboard_customize, title: "Dashboard"),
    MenuItemData(icon: Icons.account_balance_wallet, title: "Accounts"),
    MenuItemData(icon: Icons.swap_horiz, title: "Transactions"),
    MenuItemData(icon: Icons.pie_chart, title: "Budgets"),
    MenuItemData(icon: Icons.receipt_long, title: "Tax Records"),
    MenuItemData(icon: Icons.logout, title: "Logout"),
  ];

  int selected = 0;

  @override
  Widget build(BuildContext context) {
    final Color bgColor =
        widget.backgroundColor ?? const Color(0xFF233142); // dark blue
    final Color selectedColor =
        widget.highlightColor ?? const Color(0xFF3A506B); // lighter blue
    const Color tealColor = Color(0xFF20C997); // project teal
    const Color textColor = Color(0xFFB2DFDB); // light teal for text
    return SafeArea(
      child: Container(
        height: MediaQuery.of(context).size.height,
        decoration: BoxDecoration(
          border: Border(
            right: BorderSide(
              color: Colors.grey[900]!,
              width: 1,
            ),
          ),
          color: bgColor,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 0.0, horizontal: 0.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 80,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                alignment: Alignment.centerLeft,
                color: const Color(0xFF233142),
                child: const Row(
                  children: [
                    Icon(Icons.show_chart, color: tealColor, size: 32),
                    SizedBox(width: 10),
                    Text(
                      'MyFinance360',
                      style: TextStyle(
                        color: tealColor,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Roboto',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              for (var i = 0; i < menu.length; i++)
                if (i == menu.length - 1) // Logout at the bottom
                  Expanded(
                    child: Align(
                      alignment: Alignment.bottomLeft,
                      child: _buildMenuItem(
                          i, selectedColor, tealColor, textColor),
                    ),
                  )
                else
                  _buildMenuItem(i, selectedColor, tealColor, textColor),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(
      int i, Color selectedColor, Color tealColor, Color textColor) {
    bool isSelected = selected == i;
    if (menu[i].title == "Logout") {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.all(Radius.circular(10.0)),
          color: isSelected ? selectedColor : Colors.transparent,
        ),
        child: InkWell(
          onTap: () => _logout(context),
          borderRadius: const BorderRadius.all(Radius.circular(10.0)),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
            child: Row(
              children: [
                Icon(
                  menu[i].icon,
                  color: isSelected ? tealColor : textColor,
                  size: 22,
                ),
                const SizedBox(width: 16),
                Text(
                  menu[i].title,
                  style: TextStyle(
                    fontSize: 16,
                    color: isSelected ? Colors.white : textColor,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.all(Radius.circular(10.0)),
        color: isSelected ? selectedColor : Colors.transparent,
      ),
              child: InkWell(
          onTap: () {
            setState(() {
              selected = i;
            });
            widget.scaffoldKey.currentState!.closeDrawer();
            
            // Navigate to appropriate page based on menu item
            if (menu[i].title == "Transactions") {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TransactionsPage()),
              );
            } else if (menu[i].title == "Accounts") {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AccountsPage()),
              );
            } else if (menu[i].title == "Budgets") {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const BudgetPage()),
              );
            } else if (menu[i].title == "Tax Records") {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TaxRecordsPage()),
              );
            }
            // Add more navigation cases here for other menu items
          },
        borderRadius: const BorderRadius.all(Radius.circular(10.0)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
          child: Row(
            children: [
              Icon(
                menu[i].icon,
                color: isSelected ? tealColor : textColor,
                size: 22,
              ),
              const SizedBox(width: 16),
              Text(
                menu[i].title,
                style: TextStyle(
                  fontSize: 16,
                  color: isSelected ? Colors.white : textColor,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    try {
      await http.post(
        Uri.parse('http://localhost:3000/api/auth/logout-api'),
        headers: {'Authorization': 'Bearer $token'},
      );
    } catch (e) {
      // Ignore errors for logout
    }
    await prefs.remove('token');
    await prefs.remove('refreshToken');
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const LoginPage()),
      (route) => false,
    );
  }
}
