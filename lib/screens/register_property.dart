import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import '../widgets/property_form_widgets.dart';

class RegisterPropertyScreen extends StatefulWidget {
  const RegisterPropertyScreen({super.key});

  @override
  _RegisterPropertyScreenState createState() => _RegisterPropertyScreenState();
}

class _RegisterPropertyScreenState extends State<RegisterPropertyScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();

  int _currentStep = 1; // 1 = Details, 2 = Media Upload
  bool _isLoading = false;
  String? _createdPropertyId;

  // Controllers
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _cityController = TextEditingController();
  final _streetController = TextEditingController();
  final _subCityController = TextEditingController();
  final _woredaController = TextEditingController();
  final _houseNumberController = TextEditingController();

  // Shared State
  String _type = 'BUILDING';
  String _status = 'ACTIVE';

  // Building Fields
  String _buildingType = 'APARTMENT';
  final _totalFloorsController = TextEditingController();
  final _totalUnitsController = TextEditingController();
  bool _hasElevator = false;
  bool _hasParking = false;
  bool _hasSecurity = false;
  final _yearBuiltController = TextEditingController();
  final _amenitiesController = TextEditingController();

  // Vehicle Fields
  final _plateNumberController = TextEditingController();
  String _vehicleType = 'SEDAN';
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _manufactureYearController = TextEditingController();
  final _colorController = TextEditingController();
  String _transmissionType = 'AUTOMATIC';
  String _fuelType = 'PETROL';
  final _engineCapacityController = TextEditingController();
  final _mileageController = TextEditingController();

  // Media
  XFile? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _cityController.dispose();
    _streetController.dispose();
    _subCityController.dispose();
    _woredaController.dispose();
    _houseNumberController.dispose();
    _totalFloorsController.dispose();
    _totalUnitsController.dispose();
    _yearBuiltController.dispose();
    _amenitiesController.dispose();
    _plateNumberController.dispose();
    _brandController.dispose();
    _modelController.dispose();
    _manufactureYearController.dispose();
    _colorController.dispose();
    _engineCapacityController.dispose();
    _mileageController.dispose();
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

  Future<void> _submitStep1() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final Map<String, dynamic> payload = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'type': _type,
        'addressCity': _cityController.text.trim(),
        'addressStreet': _streetController.text.trim(),
        'addressSubCity': _subCityController.text.trim(),
        'addressWoreda': _woredaController.text.trim(),
        'addressHouseNumber': _houseNumberController.text.trim(),
      };

      if (_type == 'BUILDING') {
        payload['buildingDetails'] = {
          'buildingType': _buildingType,
          'totalFloors': int.tryParse(_totalFloorsController.text) ?? 0,
          'totalUnits': int.tryParse(_totalUnitsController.text) ?? 0,
          'hasElevator': _hasElevator,
          'hasParking': _hasParking,
          'hasSecurity': _hasSecurity,
          'yearBuilt': int.tryParse(_yearBuiltController.text),
          'amenities': _amenitiesController.text.trim().isEmpty 
              ? [] 
              : _amenitiesController.text.split(',').map((e) => e.trim()).toList(),
        };
      } else {
        payload['vehicleDetails'] = {
          'plateNumber': _plateNumberController.text.trim(),
          'vehicleType': _vehicleType,
          'brand': _brandController.text.trim(),
          'model': _modelController.text.trim(),
          'manufactureYear': int.tryParse(_manufactureYearController.text),
          'color': _colorController.text.trim(),
          'transmissionType': _transmissionType,
          'fuelType': _fuelType,
          'engineCapacity': _engineCapacityController.text.trim(),
          'mileage': int.tryParse(_mileageController.text),
        };
      }

      final response = await _apiService.createProperty(payload);

      if (response.isSuccess && response.data != null) {
        _showSuccess('Property created successfully!');
        setState(() {
          _createdPropertyId = response.data!.id;
          _currentStep = 2;
        });
      } else {
        _showError(response.error ?? 'Failed to create property');
      }
    } catch (e) {
      _showError('An unexpected error occurred: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() => _selectedImage = image);
    }
  }

  Future<void> _submitStep2() async {
    if (_selectedImage == null) {
      _showError('Please select an image first.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final bytes = await _selectedImage!.readAsBytes();
      final response = await _apiService.uploadPropertyMedia(
        _createdPropertyId!,
        bytes,
        _selectedImage!.name,
      );

      if (response.isSuccess) {
        _showSuccess('Image uploaded successfully!');
        if (mounted) Navigator.of(context).pop();
      } else {
        _showError(response.error ?? 'Failed to upload image');
      }
    } catch (e) {
      _showError('An unexpected error occurred: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_currentStep == 1 ? 'Register Property' : 'Upload Property Image', style: const TextStyle(color: Colors.white)),
        backgroundColor: Colors.indigo,
        elevation: 0,
      ),
      body: LoadingOverlay(
        isLoading: _isLoading,
        child: _currentStep == 1 ? _buildStep1() : _buildStep2(),
      ),
    );
  }

  // Helper: lays two widgets side-by-side on wide screens, stacked on narrow ones.
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

  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(title: 'General Information'),
            _responsiveRow(
              PropertyDropdown<String>(
                value: _type,
                label: 'Property Type',
                icon: Icons.category,
                isRequired: true,
                items: const [
                  DropdownMenuItem(value: 'BUILDING', child: Text('Building')),
                  DropdownMenuItem(value: 'VEHICLE', child: Text('Vehicle')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _type = val);
                },
              ),
              PropertyDropdown<String>(
                value: _status,
                label: 'Status',
                icon: Icons.info_outline,
                isRequired: true,
                items: const [
                  DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                  DropdownMenuItem(value: 'INACTIVE', child: Text('Inactive')),
                  DropdownMenuItem(value: 'MAINTENANCE', child: Text('Maintenance')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _status = val);
                },
              ),
            ),
            const SizedBox(height: 16),
            PropertyTextField(
              controller: _titleController,
              label: 'Property Title',
              icon: Icons.title,
              isRequired: true,
              validator: (val) => val == null || val.trim().isEmpty ? 'Title is required' : null,
            ),
            const SizedBox(height: 16),
            PropertyTextField(
              controller: _descriptionController,
              label: 'Description (Optional)',
              icon: Icons.description,
              maxLines: 3,
            ),

            const SectionHeader(title: 'Location & Address'),
            PropertyTextField(
              controller: _cityController,
              label: 'City',
              icon: Icons.location_city,
              isRequired: true,
              validator: (val) => val == null || val.trim().isEmpty ? 'City is required' : null,
            ),
            const SizedBox(height: 16),
            _responsiveRow(
              PropertyTextField(
                controller: _subCityController,
                label: 'Sub City',
                icon: Icons.location_on_outlined,
                isRequired: true,
                validator: (val) => val == null || val.trim().isEmpty ? 'Sub City is required' : null,
              ),
              PropertyTextField(
                controller: _woredaController,
                label: 'Woreda',
                icon: Icons.location_on,
                isRequired: true,
                validator: (val) => val == null || val.trim().isEmpty ? 'Woreda is required' : null,
              ),
            ),
            const SizedBox(height: 16),
            _responsiveRow(
              PropertyTextField(
                controller: _streetController,
                label: 'Street',
                icon: Icons.add_road,
                isRequired: true,
                validator: (val) => val == null || val.trim().isEmpty ? 'Street is required' : null,
              ),
              PropertyTextField(
                controller: _houseNumberController,
                label: 'House No.',
                icon: Icons.home,
                isRequired: true,
                validator: (val) => val == null || val.trim().isEmpty ? 'House No is required' : null,
              ),
            ),

            SectionHeader(title: _type == 'BUILDING' ? 'Building Details' : 'Vehicle Details'),
            if (_type == 'BUILDING') _buildBuildingFields() else _buildVehicleFields(),
            
            const SizedBox(height: 40),
            PropertySubmitButton(
              label: 'Save & Continue',
              isLoading: _isLoading,
              onPressed: _submitStep1,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBuildingFields() {
    return Column(
      children: [
        PropertyDropdown<String>(
          value: _buildingType,
          label: 'Building Type',
          icon: Icons.business,
          items: const [
            DropdownMenuItem(value: 'APARTMENT', child: Text('Apartment')),
            DropdownMenuItem(value: 'HOUSE', child: Text('House')),
            DropdownMenuItem(value: 'OFFICE', child: Text('Office')),
            DropdownMenuItem(value: 'WAREHOUSE', child: Text('Warehouse')),
            DropdownMenuItem(value: 'COMMERCIAL', child: Text('Commercial')),
          ],
          onChanged: (val) => setState(() => _buildingType = val!),
        ),
        const SizedBox(height: 16),
        _responsiveRow(
          PropertyTextField(
            controller: _totalFloorsController,
            label: 'Total Floors',
            icon: Icons.layers,
            keyboardType: TextInputType.number,
            isRequired: true,
            validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
          ),
          PropertyTextField(
            controller: _totalUnitsController,
            label: 'Total Units',
            icon: Icons.door_front_door,
            keyboardType: TextInputType.number,
            isRequired: true,
            validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
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
            if (year == null || year < 1800 || year > DateTime.now().year) return 'Invalid year';
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

  Widget _buildVehicleFields() {
    return Column(
      children: [
        PropertyTextField(
          controller: _plateNumberController,
          label: 'Plate Number',
          icon: Icons.confirmation_number,
          isRequired: true,
          validator: (val) => val == null || val.trim().isEmpty ? 'Plate number is required' : null,
        ),
        const SizedBox(height: 16),
        PropertyDropdown<String>(
          value: _vehicleType,
          label: 'Vehicle Type',
          icon: Icons.car_repair,
          items: const [
            DropdownMenuItem(value: 'SEDAN', child: Text('Sedan')),
            DropdownMenuItem(value: 'SUV', child: Text('SUV')),
            DropdownMenuItem(value: 'TRUCK', child: Text('Truck')),
            DropdownMenuItem(value: 'VAN', child: Text('Van')),
            DropdownMenuItem(value: 'MOTORCYCLE', child: Text('Motorcycle')),
          ],
          onChanged: (val) => setState(() => _vehicleType = val!),
        ),
        const SizedBox(height: 16),
        _responsiveRow(
          PropertyTextField(
            controller: _brandController,
            label: 'Make / Brand',
            icon: Icons.directions_car,
            isRequired: true,
            validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
          ),
          PropertyTextField(
            controller: _modelController,
            label: 'Model',
            icon: Icons.model_training,
            isRequired: true,
            validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
          ),
        ),
        const SizedBox(height: 16),
        _responsiveRow(
          PropertyTextField(
            controller: _manufactureYearController,
            label: 'Year',
            icon: Icons.calendar_today,
            keyboardType: TextInputType.number,
            isRequired: true,
            validator: (val) {
              if (val == null || val.trim().isEmpty) return 'Required';
              final year = int.tryParse(val);
              if (year == null || year < 1900 || year > DateTime.now().year + 1) return 'Invalid';
              return null;
            },
          ),
          PropertyTextField(
            controller: _colorController,
            label: 'Color',
            icon: Icons.palette,
            isRequired: true,
            validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
          ),
        ),
        const SizedBox(height: 16),
        _responsiveRow(
          PropertyDropdown<String>(
            value: _transmissionType,
            label: 'Transmission',
            icon: Icons.settings,
            items: const [
              DropdownMenuItem(value: 'AUTOMATIC', child: Text('Automatic')),
              DropdownMenuItem(value: 'MANUAL', child: Text('Manual')),
            ],
            onChanged: (val) => setState(() => _transmissionType = val!),
          ),
          PropertyDropdown<String>(
            value: _fuelType,
            label: 'Fuel Type',
            icon: Icons.local_gas_station,
            items: const [
              DropdownMenuItem(value: 'PETROL', child: Text('Petrol')),
              DropdownMenuItem(value: 'DIESEL', child: Text('Diesel')),
              DropdownMenuItem(value: 'ELECTRIC', child: Text('Electric')),
              DropdownMenuItem(value: 'HYBRID', child: Text('Hybrid')),
            ],
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

  Widget _buildStep2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          const SizedBox(height: 40),
          const Icon(Icons.check_circle, color: Colors.green, size: 80),
          const SizedBox(height: 24),
          const Text('Property Created!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Now, let\'s add an image to make it stand out.', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: Colors.black54)),
          const SizedBox(height: 40),
          if (_selectedImage != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(border: Border.all(color: Colors.indigo.withOpacity(0.3)), borderRadius: BorderRadius.circular(12), color: Colors.indigo.withOpacity(0.05)),
              child: Row(
                children: [
                  const Icon(Icons.image, color: Colors.indigo),
                  const SizedBox(width: 16),
                  Expanded(child: Text(_selectedImage!.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500))),
                  IconButton(icon: const Icon(Icons.close, color: Colors.red), onPressed: () => setState(() => _selectedImage = null)),
                ],
              ),
            )
          else
            InkWell(
              onTap: _pickImage,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 40),
                decoration: BoxDecoration(border: Border.all(color: Colors.grey[300]!, style: BorderStyle.solid), borderRadius: BorderRadius.circular(12)),
                child: Column(
                  children: [
                    Icon(Icons.add_a_photo, size: 48, color: Colors.grey[400]),
                    const SizedBox(height: 12),
                    Text('Select Property Image', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 40),
          PropertySubmitButton(label: 'Upload & Finish', isLoading: _isLoading, onPressed: _submitStep2),
          const SizedBox(height: 16),
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Skip for now', style: TextStyle(color: Colors.grey, fontSize: 16))),
        ],
      ),
    );
  }
}
