import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/api_response.dart';
import '../models/rental_unit.dart';
import '../widgets/property_form_widgets.dart';

class AddUnitScreen extends StatefulWidget {
  final String propertyId;
  final String propertyTitle;

  const AddUnitScreen({
    super.key,
    required this.propertyId,
    required this.propertyTitle,
  });

  @override
  _AddUnitScreenState createState() => _AddUnitScreenState();
}

class _AddUnitScreenState extends State<AddUnitScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  String _selectedStatus = 'VACANT';

  final _unitNumberController = TextEditingController();
  final _floorNumberController = TextEditingController();
  final _rentAmountController = TextEditingController();
  final _depositAmountController = TextEditingController();
  final _areaController = TextEditingController();
  final _bedroomsController = TextEditingController();
  final _bathroomsController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _amenitiesController = TextEditingController();

  @override
  void dispose() {
    _unitNumberController.dispose();
    _floorNumberController.dispose();
    _rentAmountController.dispose();
    _depositAmountController.dispose();
    _areaController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    _descriptionController.dispose();
    _amenitiesController.dispose();
    super.dispose();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final Map<String, dynamic> payload = {
        'unitIdentifier': _unitNumberController.text.trim(),
        'rentAmount': double.tryParse(_rentAmountController.text) ?? 0.0,
        'status': _selectedStatus,
      };

      if (_floorNumberController.text.trim().isNotEmpty) {
        final floor = int.tryParse(_floorNumberController.text.trim());
        if (floor != null) payload['floorNumber'] = floor;
      }
      if (_depositAmountController.text.trim().isNotEmpty) {
        final deposit = double.tryParse(_depositAmountController.text.trim());
        if (deposit != null) payload['depositAmount'] = deposit;
      }
      if (_areaController.text.trim().isNotEmpty) {
        final area = double.tryParse(_areaController.text.trim());
        if (area != null) payload['areaSqMeters'] = area;
      }
      if (_bedroomsController.text.trim().isNotEmpty) {
        final beds = int.tryParse(_bedroomsController.text.trim());
        if (beds != null) payload['bedrooms'] = beds;
      }
      if (_bathroomsController.text.trim().isNotEmpty) {
        final baths = int.tryParse(_bathroomsController.text.trim());
        if (baths != null) payload['bathrooms'] = baths;
      }
      if (_descriptionController.text.trim().isNotEmpty) {
        payload['description'] = _descriptionController.text.trim();
      }
      if (_amenitiesController.text.trim().isNotEmpty) {
        payload['amenities'] = _amenitiesController.text
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList();
      }

      final response = await _apiService.addRentalUnit(widget.propertyId, payload);

      if (response.isSuccess) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Unit added successfully'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.error ?? 'Failed to add unit'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error adding unit: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Add New Unit', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.indigo,
        elevation: 0,
      ),
      body: LoadingOverlay(
        isLoading: _isLoading,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Property: ${widget.propertyTitle}',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SectionHeader(title: 'Basic Details'),
                PropertyTextField(
                  controller: _unitNumberController,
                  label: 'Unit Identifier (e.g. A-101)',
                  icon: Icons.numbers,
                  isRequired: true,
                  validator: (val) =>
                      val == null || val.isEmpty ? 'Unit number is required' : null,
                ),
                const SizedBox(height: 16),
                PropertyDropdown<String>(
                  value: _selectedStatus,
                  label: 'Status',
                  icon: Icons.info_outline,
                  isRequired: true,
                  items: const [
                    DropdownMenuItem(value: 'VACANT', child: Text('Vacant')),
                    DropdownMenuItem(value: 'OCCUPIED', child: Text('Occupied')),
                    DropdownMenuItem(value: 'MAINTENANCE', child: Text('Maintenance')),
                    DropdownMenuItem(value: 'UNAVAILABLE', child: Text('Unavailable')),
                  ],
                  onChanged: (val) => setState(() => _selectedStatus = val!),
                ),
                const SizedBox(height: 16),
                PropertyTextField(
                  controller: _descriptionController,
                  label: 'Description (Optional)',
                  icon: Icons.description,
                  maxLines: 3,
                ),
                const SectionHeader(title: 'Pricing'),
                Row(
                  children: [
                    Expanded(
                      child: PropertyTextField(
                        controller: _rentAmountController,
                        label: 'Monthly Rent',
                        icon: Icons.attach_money,
                        isRequired: true,
                        keyboardType:
                            const TextInputType.numberWithOptions(decimal: true),
                        validator: (val) =>
                            val == null || val.isEmpty ? 'Rent is required' : null,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: PropertyTextField(
                        controller: _depositAmountController,
                        label: 'Deposit',
                        icon: Icons.security,
                        isRequired: true,
                        keyboardType:
                            const TextInputType.numberWithOptions(decimal: true),
                        validator: (val) =>
                            val == null || val.isEmpty ? 'Deposit is required' : null,
                      ),
                    ),
                  ],
                ),
                const SectionHeader(title: 'Specifications'),
                Row(
                  children: [
                    Expanded(
                      child: PropertyTextField(
                        controller: _bedroomsController,
                        label: 'Bedrooms',
                        icon: Icons.bed,
                        isRequired: true,
                        keyboardType: TextInputType.number,
                        validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: PropertyTextField(
                        controller: _bathroomsController,
                        label: 'Bathrooms',
                        icon: Icons.bathtub,
                        isRequired: true,
                        keyboardType: TextInputType.number,
                        validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: PropertyTextField(
                        controller: _floorNumberController,
                        label: 'Floor',
                        icon: Icons.layers,
                        isRequired: true,
                        keyboardType: TextInputType.number,
                        validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: PropertyTextField(
                        controller: _areaController,
                        label: 'Area (sq m)',
                        icon: Icons.square_foot,
                        isRequired: true,
                        keyboardType:
                            const TextInputType.numberWithOptions(decimal: true),
                        validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                PropertyTextField(
                  controller: _amenitiesController,
                  label: 'Amenities (Optional, comma separated)',
                  icon: Icons.featured_play_list,
                ),
                const SizedBox(height: 40),
                PropertySubmitButton(
                  label: 'Add Unit',
                  isLoading: _isLoading,
                  onPressed: _submitForm,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
