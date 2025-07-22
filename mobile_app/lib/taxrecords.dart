import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class TaxRecord {
  final int id;
  final String recordType;
  final double amount;
  final int taxYear;
  final String description;
  final String? documentUrl;
  final DateTime dueDate;
  final String status;
  final DateTime createdAt;

  TaxRecord({
    required this.id,
    required this.recordType,
    required this.amount,
    required this.taxYear,
    required this.description,
    this.documentUrl,
    required this.dueDate,
    required this.status,
    required this.createdAt,
  });

  factory TaxRecord.fromJson(Map<String, dynamic> json) {
    return TaxRecord(
      id: json['id'],
      recordType: json['record_type'] ?? '',
      amount: double.tryParse(json['amount'].toString()) ?? 0.0,
      taxYear: json['tax_year'] ?? DateTime.now().year,
      description: json['description'] ?? '',
      documentUrl: json['document_url'],
      dueDate: DateTime.parse(json['due_date'] ?? DateTime.now().toIso8601String()),
      status: json['status'] ?? 'pending',
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'record_type': recordType,
      'amount': amount,
      'tax_year': taxYear,
      'description': description,
      'due_date': dueDate.toIso8601String(),
      'status': status,
    };
  }

  Color get statusColor {
    switch (status.toLowerCase()) {
      case 'paid':
        return Colors.green;
      case 'overdue':
        return Colors.red;
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData get statusIcon {
    switch (status.toLowerCase()) {
      case 'paid':
        return Icons.check_circle;
      case 'overdue':
        return Icons.warning;
      case 'pending':
        return Icons.schedule;
      default:
        return Icons.info;
    }
  }
}

class TaxRecordsPage extends StatefulWidget {
  @override
  _TaxRecordsPageState createState() => _TaxRecordsPageState();
}

class _TaxRecordsPageState extends State<TaxRecordsPage> {
  List<TaxRecord> taxRecords = [];
  bool isLoading = true;
  String? error;
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _taxYearController = TextEditingController();
  String _selectedType = 'income_tax';
  String _selectedStatus = 'pending';
  DateTime _selectedDueDate = DateTime.now().add(Duration(days: 30));

  @override
  void initState() {
    super.initState();
    _taxYearController.text = DateTime.now().year.toString();
    fetchTaxRecords();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    _taxYearController.dispose();
    super.dispose();
  }

  Future<void> fetchTaxRecords() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.get(
        Uri.parse('http://localhost:3000/api/tax-records'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List recordsData = data['tax_records'] ?? data;
        setState(() {
          taxRecords = recordsData.map((json) => TaxRecord.fromJson(json)).toList();
          isLoading = false;
        });
      } else {
        setState(() {
          error = 'Failed to load tax records: ${response.body}';
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

  Future<void> addTaxRecord() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/tax-records'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'record_type': _selectedType,
          'amount': double.parse(_amountController.text),
          'tax_year': int.parse(_taxYearController.text),
          'description': _descriptionController.text,
          'due_date': _selectedDueDate.toIso8601String(),
          'status': _selectedStatus,
        }),
      );

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Tax record added successfully!'), backgroundColor: Colors.green),
        );
        _clearForm();
        fetchTaxRecords(); // Refresh the list
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add tax record: ${response.body}'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _clearForm() {
    _amountController.clear();
    _descriptionController.clear();
    _taxYearController.text = DateTime.now().year.toString();
    _selectedType = 'income_tax';
    _selectedStatus = 'pending';
    _selectedDueDate = DateTime.now().add(Duration(days: 30));
  }

  Future<void> _selectDueDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDueDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(Duration(days: 365)),
    );
    if (picked != null && picked != _selectedDueDate) {
      setState(() {
        _selectedDueDate = picked;
      });
    }
  }

  String _getRecordTypeDisplay(String type) {
    switch (type) {
      case 'income_tax':
        return 'Income Tax';
      case 'property_tax':
        return 'Property Tax';
      case 'sales_tax':
        return 'Sales Tax';
      case 'business_tax':
        return 'Business Tax';
      case 'other':
        return 'Other';
      default:
        return type.replaceAll('_', ' ').toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tax Records'),
        backgroundColor: Color(0xFF233142),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: fetchTaxRecords,
          ),
        ],
      ),
      body: Column(
        children: [
          // Add Tax Record Form
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Add New Tax Record', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _amountController,
                          decoration: InputDecoration(
                            labelText: 'Amount',
                            border: OutlineInputBorder(),
                            prefixText: '\$',
                          ),
                          keyboardType: TextInputType.number,
                          validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: TextFormField(
                          controller: _taxYearController,
                          decoration: InputDecoration(
                            labelText: 'Tax Year',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedType,
                          decoration: InputDecoration(
                            labelText: 'Record Type',
                            border: OutlineInputBorder(),
                          ),
                          items: [
                            'income_tax',
                            'property_tax',
                            'sales_tax',
                            'business_tax',
                            'other'
                          ].map((type) {
                            return DropdownMenuItem(value: type, child: Text(_getRecordTypeDisplay(type)));
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedType = value!;
                            });
                          },
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedStatus,
                          decoration: InputDecoration(
                            labelText: 'Status',
                            border: OutlineInputBorder(),
                          ),
                          items: ['pending', 'paid', 'overdue'].map((status) {
                            return DropdownMenuItem(value: status, child: Text(status.toUpperCase()));
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedStatus = value!;
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _descriptionController,
                          decoration: InputDecoration(
                            labelText: 'Description',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: InkWell(
                          onTap: () => _selectDueDate(context),
                          child: InputDecorator(
                            decoration: InputDecoration(
                              labelText: 'Due Date',
                              border: OutlineInputBorder(),
                            ),
                            child: Text('${_selectedDueDate.toLocal()}'.split(' ')[0]),
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: addTaxRecord,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF20C997),
                        foregroundColor: Colors.white,
                      ),
                      child: Text('Add Tax Record'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Tax Records List
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : error != null
                    ? Center(child: Text(error!, style: TextStyle(color: Colors.red)))
                    : taxRecords.isEmpty
                        ? Center(child: Text('No tax records found'))
                        : ListView.builder(
                            itemCount: taxRecords.length,
                            itemBuilder: (context, index) {
                              final record = taxRecords[index];
                              return Card(
                                margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: record.statusColor,
                                    child: Icon(
                                      record.statusIcon,
                                      color: Colors.white,
                                    ),
                                  ),
                                  title: Text(
                                    _getRecordTypeDisplay(record.recordType),
                                    style: TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(record.description),
                                      Text('Tax Year: ${record.taxYear} • Due: ${record.dueDate.toString().substring(0, 10)}'),
                                    ],
                                  ),
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '\$${record.amount.toStringAsFixed(2)}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                          color: Color(0xFF233142),
                                        ),
                                      ),
                                      Container(
                                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: record.statusColor,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          record.status.toUpperCase(),
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
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