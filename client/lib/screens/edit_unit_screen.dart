import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/rental_unit.dart';
import '../widgets/property_form_widgets.dart';

class EditUnitScreen extends StatefulWidget {
  final RentalUnit unit;

  const EditUnitScreen({super.key, required this.unit});

  @override
  State<EditUnitScreen> createState() => _EditUnitScreenState();
}

class _EditUnitScreenState extends State<EditUnitScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  late TextEditingController _identifierController;
  late TextEditingController _rentController;
  late TextEditingController _depositController;
  late TextEditingController _bedroomsController;
  late TextEditingController _bathroomsController;
  late TextEditingController _floorController;
  late TextEditingController _areaController;
  late TextEditingController _descriptionController;
  late TextEditingController _amenitiesController;
  late String _status;

  @override
  void initState() {
    super.initState();
    final u = widget.unit;
    _identifierController = TextEditingController(text: u.unitIdentifier);
    _rentController = TextEditingController(text: u.rentAmount.toString());
    _depositController = TextEditingController(text: u.depositAmount?.toString() ?? '');
    _bedroomsController = TextEditingController(text: u.bedrooms?.toString() ?? '');
    _bathroomsController = TextEditingController(text: u.bathrooms?.toString() ?? '');
    _floorController = TextEditingController(text: u.floorNumber?.toString() ?? '');
    _areaController = TextEditingController(text: u.areaSqMeters?.toString() ?? '');
    _descriptionController = TextEditingController(text: u.description ?? '');
    _amenitiesController = TextEditingController(text: (u.amenities ?? []).join(', '));
    _status = u.status;
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _rentController.dispose();
    _depositController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    _floorController.dispose();
    _areaController.dispose();
    _descriptionController.dispose();
    _amenitiesController.dispose();
    super.dispose();
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _showSuccess(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final Map<String, dynamic> data = {
        'unitIdentifier': _identifierController.text.trim(),
        'rentAmount': num.tryParse(_rentController.text) ?? 0,
        'status': _status,
      };

      if (_depositController.text.isNotEmpty) {
        data['depositAmount'] = num.tryParse(_depositController.text);
      }
      if (_bedroomsController.text.isNotEmpty) {
        data['bedrooms'] = int.tryParse(_bedroomsController.text);
      }
      if (_bathroomsController.text.isNotEmpty) {
        data['bathrooms'] = int.tryParse(_bathroomsController.text);
      }
      if (_floorController.text.isNotEmpty) {
        data['floorNumber'] = int.tryParse(_floorController.text);
      }
      if (_areaController.text.isNotEmpty) {
        data['areaSqMeters'] = num.tryParse(_areaController.text);
      }
      if (_descriptionController.text.trim().isNotEmpty) {
        data['description'] = _descriptionController.text.trim();
      }
      if (_amenitiesController.text.trim().isNotEmpty) {
        data['amenities'] = _amenitiesController.text.split(',').map((e) => e.trim()).toList();
      }

      final response = await _apiService.updateRentalUnit(widget.unit.id, data);

      if (response.isSuccess) {
        _showSuccess('Unit updated successfully');
        if (mounted) {
          Navigator.pop(context, true);
        }
      } else {
        _showError(response.error ?? 'Update failed');
      }
    } catch (e) {
      _showError('Error saving changes: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmDelete() async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Unit'),
        content: const Text(
          'Delete this unit? This action cannot be undone and will affect associated active leases.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      _deleteUnit();
    }
  }

  Future<void> _deleteUnit() async {
    setState(() => _isLoading = true);
    final response = await _apiService.deleteRentalUnit(widget.unit.id);

    if (mounted) {
      if (response.isSuccess) {
        _showSuccess('Unit deleted successfully');
        Navigator.pop(context, true);
      } else {
        setState(() => _isLoading = false);
        _showError(response.error ?? 'Delete failed');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Unit', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.indigo,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
            onPressed: _confirmDelete,
          ),
        ],
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
                const SectionHeader(title: 'Basic Details'),
                PropertyTextField(
                  controller: _identifierController,
                  label: 'Unit Identifier (e.g. Apt 101)',
                  icon: Icons.door_front_door,
                  isRequired: true,
                  validator: (val) => val == null || val.isEmpty ? 'Identifier is required' : null,
                ),
                const SizedBox(height: 16),
                PropertyDropdown<String>(
                  value: _status,
                  label: 'Status',
                  icon: Icons.info_outline,
                  isRequired: true,
                  items: const [
                    DropdownMenuItem(value: 'VACANT', child: Text('Vacant')),
                    DropdownMenuItem(value: 'OCCUPIED', child: Text('Occupied')),
                    DropdownMenuItem(value: 'MAINTENANCE', child: Text('Maintenance')),
                    DropdownMenuItem(value: 'UNAVAILABLE', child: Text('Unavailable')),
                  ],
                  onChanged: (val) => setState(() => _status = val!),
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
                        controller: _rentController,
                        label: 'Rent Amount',
                        icon: Icons.attach_money,
                        isRequired: true,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        validator: (val) => val == null || val.isEmpty ? 'Rent is required' : null,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: PropertyTextField(
                        controller: _depositController,
                        label: 'Deposit',
                        icon: Icons.savings,
                        isRequired: true,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        validator: (val) => val == null || val.isEmpty ? 'Deposit is required' : null,
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
                        controller: _floorController,
                        label: 'Floor No.',
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
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
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
                  label: 'Save Changes',
                  isLoading: _isLoading,
                  onPressed: _saveChanges,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
