import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/api_service.dart';
import '../models/property.dart';
import '../models/property_media.dart';
import '../widgets/property_form_widgets.dart';

class EditPropertyScreen extends StatefulWidget {
  final Property property;

  const EditPropertyScreen({super.key, required this.property});

  @override
  _EditPropertyScreenState createState() => _EditPropertyScreenState();
}

class _EditPropertyScreenState extends State<EditPropertyScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _cityController;
  late TextEditingController _streetController;
  late TextEditingController _subCityController;
  late TextEditingController _woredaController;
  late TextEditingController _houseNumberController;
  late String _status;
  List<PropertyMedia> _media = [];
  Map<String, String> _authHeaders = {};

  // Building Details
  late TextEditingController _totalFloorsController;
  late TextEditingController _totalUnitsController;
  late TextEditingController _yearBuiltController;
  late TextEditingController _amenitiesController;
  late bool _hasElevator;
  late bool _hasParking;
  late bool _hasSecurity;

  // Vehicle Details
  late TextEditingController _brandController;
  late TextEditingController _modelController;
  late TextEditingController _plateNumberController;
  late TextEditingController _vehicleYearController;
  late TextEditingController _colorController;
  late TextEditingController _engineCapacityController;
  late TextEditingController _mileageController;
  late String _transmissionType;
  late String _fuelType;

  @override
  void initState() {
    super.initState();
    _fetchAuthHeaders();
    final p = widget.property;
    _media = List.from(p.media ?? []);
    _titleController = TextEditingController(text: p.title);
    _descriptionController = TextEditingController(text: p.description);
    _cityController = TextEditingController(text: p.addressCity);
    _streetController = TextEditingController(text: p.addressStreet);
    _subCityController = TextEditingController(text: p.addressSubCity);
    _woredaController = TextEditingController(text: p.addressWoreda);
    _houseNumberController = TextEditingController(text: p.addressHouseNumber);
    _status = p.status;

    if (p.type == 'BUILDING') {
      final bd = p.buildingDetails ?? {};
      _totalFloorsController =
          TextEditingController(text: bd['totalFloors']?.toString() ?? '');
      _totalUnitsController =
          TextEditingController(text: bd['totalUnits']?.toString() ?? '');
      _yearBuiltController =
          TextEditingController(text: bd['yearBuilt']?.toString() ?? '');
      _amenitiesController = TextEditingController(
          text: (bd['amenities'] as List?)?.join(', ') ?? '');
      _hasElevator = bd['hasElevator'] ?? false;
      _hasParking = bd['hasParking'] ?? false;
      _hasSecurity = bd['hasSecurity'] ?? false;
    } else {
      final vd = p.vehicleDetails ?? {};
      _brandController = TextEditingController(text: vd['brand'] ?? '');
      _modelController = TextEditingController(text: vd['model'] ?? '');
      _plateNumberController =
          TextEditingController(text: vd['plateNumber'] ?? '');
      _vehicleYearController =
          TextEditingController(text: vd['manufactureYear']?.toString() ?? '');
      _colorController = TextEditingController(text: vd['color'] ?? '');
      _engineCapacityController =
          TextEditingController(text: vd['engineCapacity']?.toString() ?? '');
      _mileageController =
          TextEditingController(text: vd['mileage']?.toString() ?? '');
      _transmissionType = vd['transmissionType'] ?? 'MANUAL';
      _fuelType = vd['fuelType'] ?? 'PETROL';
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _cityController.dispose();
    _streetController.dispose();
    _subCityController.dispose();
    _woredaController.dispose();
    _houseNumberController.dispose();
    if (widget.property.type == 'BUILDING') {
      _totalFloorsController.dispose();
      _totalUnitsController.dispose();
      _yearBuiltController.dispose();
      _amenitiesController.dispose();
    } else {
      _brandController.dispose();
      _modelController.dispose();
      _plateNumberController.dispose();
      _vehicleYearController.dispose();
      _colorController.dispose();
      _engineCapacityController.dispose();
      _mileageController.dispose();
    }
    super.dispose();
  }

  Widget _responsiveRow(Widget first, Widget second) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 400) {
          return Column(
            children: [
              first,
              const SizedBox(height: 16),
              second,
            ],
          );
        }
        return Row(
          children: [
            Expanded(child: first),
            const SizedBox(width: 16),
            Expanded(child: second),
          ],
        );
      },
    );
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

  Future<void> _fetchAuthHeaders() async {
    final headers = await _apiService.getAuthHeaders();
    if (mounted) {
      setState(() {
        _authHeaders = headers;
      });
    }
  }

  String _getImageUrl(String mediaId) {
    return '${ApiService.baseUrl}/download/property-media/$mediaId';
  }

  Future<void> _deleteMedia(String mediaId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Image'),
        content: const Text('Are you sure you want to remove this image?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);

    try {
      final response = await _apiService.deletePropertyMedia(mediaId);
      if (response.isSuccess) {
        setState(() {
          _media.removeWhere((m) => m.id == mediaId);
        });
        _showSuccess('Image removed successfully');
      } else {
        _showError(response.error ?? 'Failed to remove image');
      }
    } catch (e) {
      _showError('Error removing image: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final Map<String, dynamic> data = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'addressCity': _cityController.text.trim(),
        'addressStreet': _streetController.text.trim(),
        'addressSubCity': _subCityController.text.trim(),
        'addressWoreda': _woredaController.text.trim(),
        'addressHouseNumber': _houseNumberController.text.trim(),
        'status': _status,
      };

      if (widget.property.type == 'BUILDING') {
        data['buildingDetails'] = {
          'totalFloors': int.tryParse(_totalFloorsController.text) ?? 0,
          'totalUnits': int.tryParse(_totalUnitsController.text) ?? 0,
          'yearBuilt': int.tryParse(_yearBuiltController.text),
          'amenities': _amenitiesController.text.trim().isEmpty
              ? []
              : _amenitiesController.text
                  .split(',')
                  .map((e) => e.trim())
                  .toList(),
          'hasElevator': _hasElevator,
          'hasParking': _hasParking,
          'hasSecurity': _hasSecurity,
        };
      } else {
        data['vehicleDetails'] = {
          'brand': _brandController.text.trim(),
          'model': _modelController.text.trim(),
          'plateNumber': _plateNumberController.text.trim(),
          'manufactureYear': int.tryParse(_vehicleYearController.text),
          'color': _colorController.text.trim(),
          'engineCapacity': _engineCapacityController.text.trim(),
          'mileage': int.tryParse(_mileageController.text),
          'transmissionType': _transmissionType,
          'fuelType': _fuelType,
        };
      }

      final response =
          await _apiService.updateProperty(widget.property.id, data);

      if (response.isSuccess) {
        _showSuccess('Property updated successfully');
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title:
            const Text('Edit Property', style: TextStyle(color: Colors.white)),
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
                const SectionHeader(title: 'General Information'),
                _responsiveRow(
                  PropertyTextField(
                    label: 'Property Type',
                    initialValue: widget.property.type,
                    icon: Icons.category,
                    readOnly: true,
                    isRequired: true,
                  ),
                  PropertyDropdown<String>(
                    value: _status,
                    label: 'Status',
                    icon: Icons.info_outline,
                    isRequired: true,
                    items: ['ACTIVE', 'INACTIVE', 'MAINTENANCE']
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (val) => setState(() => _status = val!),
                  ),
                ),
                const SizedBox(height: 16),
                PropertyTextField(
                  controller: _titleController,
                  label: 'Property Title',
                  icon: Icons.title,
                  isRequired: true,
                  validator: (val) => val == null || val.trim().isEmpty
                      ? 'Title is required'
                      : null,
                ),
                const SizedBox(height: 16),
                PropertyTextField(
                  controller: _descriptionController,
                  label: 'Description (Optional)',
                  icon: Icons.description,
                  maxLines: 3,
                ),
                if (_media.isNotEmpty) ...[
                  const SectionHeader(title: 'Property Media'),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 120,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _media.length,
                      itemBuilder: (context, index) {
                        final media = _media[index];
                        return Container(
                          width: 120,
                          margin: const EdgeInsets.only(right: 12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Stack(
                              children: [
                                CachedNetworkImage(
                                  imageUrl: _getImageUrl(media.id),
                                  httpHeaders: _authHeaders,
                                  width: 120,
                                  height: 120,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(
                                    color: Colors.grey[200],
                                    child: const Center(
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2),
                                    ),
                                  ),
                                  errorWidget: (context, url, error) =>
                                      Container(
                                    color: Colors.grey[200],
                                    child: const Icon(Icons.broken_image,
                                        color: Colors.grey),
                                  ),
                                ),
                                Positioned(
                                  top: 4,
                                  right: 4,
                                  child: GestureDetector(
                                    onTap: () => _deleteMedia(media.id),
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withOpacity(0.8),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.close,
                                        color: Colors.white,
                                        size: 16,
                                      ),
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
                const SectionHeader(title: 'Location & Address'),
                PropertyTextField(
                  controller: _cityController,
                  label: 'City',
                  icon: Icons.location_city,
                  isRequired: true,
                  validator: (val) =>
                      val == null || val.trim().isEmpty ? 'City is required' : null,
                ),
                const SizedBox(height: 16),
                _responsiveRow(
                  PropertyTextField(
                    controller: _subCityController,
                    label: 'Sub City',
                    icon: Icons.location_on_outlined,
                    isRequired: true,
                    validator: (val) =>
                        val == null || val.trim().isEmpty ? 'Sub City is required' : null,
                  ),
                  PropertyTextField(
                    controller: _woredaController,
                    label: 'Woreda',
                    icon: Icons.location_on,
                    isRequired: true,
                    validator: (val) =>
                        val == null || val.trim().isEmpty ? 'Woreda is required' : null,
                  ),
                ),
                const SizedBox(height: 16),
                _responsiveRow(
                  PropertyTextField(
                    controller: _streetController,
                    label: 'Street',
                    icon: Icons.add_road,
                    isRequired: true,
                    validator: (val) =>
                        val == null || val.trim().isEmpty ? 'Street is required' : null,
                  ),
                  PropertyTextField(
                    controller: _houseNumberController,
                    label: 'House No.',
                    icon: Icons.home,
                    isRequired: true,
                    validator: (val) =>
                        val == null || val.trim().isEmpty ? 'House No is required' : null,
                  ),
                ),
                SectionHeader(
                    title: widget.property.type == 'BUILDING'
                        ? 'Building Details'
                        : 'Vehicle Details'),
                if (widget.property.type == 'BUILDING')
                  _buildBuildingSection()
                else
                  _buildVehicleSection(),
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

  Widget _buildBuildingSection() {
    return Column(
      children: [
        _responsiveRow(
          PropertyTextField(
            controller: _totalFloorsController,
            label: 'Total Floors',
            icon: Icons.layers,
            keyboardType: TextInputType.number,
            isRequired: true,
            validator: (val) =>
                val == null || val.trim().isEmpty ? 'Required' : null,
          ),
          PropertyTextField(
            controller: _totalUnitsController,
            label: 'Total Units',
            icon: Icons.door_front_door,
            keyboardType: TextInputType.number,
            isRequired: true,
            validator: (val) =>
                val == null || val.trim().isEmpty ? 'Required' : null,
          ),
        ),
        const SizedBox(height: 16),
        PropertyTextField(
          controller: _yearBuiltController,
          label: 'Year Built',
          icon: Icons.calendar_today,
          keyboardType: TextInputType.number,
          validator: (val) {
            if (val == null || val.trim().isEmpty) return null;
            final year = int.tryParse(val);
            if (year == null || year < 1800 || year > DateTime.now().year)
              return 'Invalid year';
            return null;
          },
        ),
        const SizedBox(height: 16),
        PropertyTextField(
          controller: _amenitiesController,
          label: 'Amenities (Optional)',
          icon: Icons.featured_play_list,
        ),
        const SizedBox(height: 16),
        PropertySwitch(
          label: 'Has Elevator',
          icon: Icons.elevator,
          value: _hasElevator,
          onChanged: (val) => setState(() => _hasElevator = val),
        ),
        PropertySwitch(
          label: 'Has Parking',
          icon: Icons.local_parking,
          value: _hasParking,
          onChanged: (val) => setState(() => _hasParking = val),
        ),
        PropertySwitch(
          label: 'Has Security',
          icon: Icons.security,
          value: _hasSecurity,
          onChanged: (val) => setState(() => _hasSecurity = val),
        ),
      ],
    );
  }

  Widget _buildVehicleSection() {
    return Column(
      children: [
        PropertyTextField(
          controller: _plateNumberController,
          label: 'Plate Number',
          icon: Icons.confirmation_number,
          isRequired: true,
          validator: (val) => val == null || val.trim().isEmpty
              ? 'Plate number is required'
              : null,
        ),
        const SizedBox(height: 16),
        _responsiveRow(
          PropertyTextField(
            controller: _brandController,
            label: 'Make / Brand',
            icon: Icons.directions_car,
            isRequired: true,
            validator: (val) =>
                val == null || val.trim().isEmpty ? 'Required' : null,
          ),
          PropertyTextField(
            controller: _modelController,
            label: 'Model',
            icon: Icons.model_training,
            isRequired: true,
            validator: (val) =>
                val == null || val.trim().isEmpty ? 'Required' : null,
          ),
        ),
        const SizedBox(height: 16),
        _responsiveRow(
          PropertyTextField(
            controller: _vehicleYearController,
            label: 'Year',
            icon: Icons.calendar_today,
            keyboardType: TextInputType.number,
            isRequired: true,
            validator: (val) {
              if (val == null || val.trim().isEmpty) return 'Required';
              final year = int.tryParse(val);
              if (year == null ||
                  year < 1900 ||
                  year > DateTime.now().year + 1) return 'Invalid';
              return null;
            },
          ),
          PropertyTextField(
            controller: _colorController,
            label: 'Color',
            icon: Icons.palette,
            isRequired: true,
            validator: (val) =>
                val == null || val.trim().isEmpty ? 'Required' : null,
          ),
        ),
        const SizedBox(height: 16),
        _responsiveRow(
          PropertyDropdown<String>(
            value: _transmissionType,
            label: 'Transmission',
            icon: Icons.settings,
            items: ['MANUAL', 'AUTOMATIC']
                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                .toList(),
            onChanged: (val) => setState(() => _transmissionType = val!),
          ),
          PropertyDropdown<String>(
            value: _fuelType,
            label: 'Fuel Type',
            icon: Icons.local_gas_station,
            items: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']
                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                .toList(),
            onChanged: (val) => setState(() => _fuelType = val!),
          ),
        ),
        const SizedBox(height: 16),
        _responsiveRow(
          PropertyTextField(
            controller: _engineCapacityController,
            label: 'Engine Cap. (Optional)',
            icon: Icons.speed,
          ),
          PropertyTextField(
            controller: _mileageController,
            label: 'Mileage (Optional)',
            icon: Icons.av_timer,
            keyboardType: TextInputType.number,
          ),
        ),
      ],
    );
  }
}
