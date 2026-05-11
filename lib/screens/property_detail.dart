import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import '../models/property.dart';
import 'edit_property_screen.dart';

class PropertyDetailScreen extends StatefulWidget {
  final String propertyId;

  const PropertyDetailScreen({super.key, required this.propertyId});

  @override
  State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  final ApiService _apiService = ApiService();
  Property? _property;
  bool _isLoading = true;
  String? _error;
  Map<String, String> _authHeaders = {};
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _fetchAuthHeaders();
    _fetchPropertyDetails();
  }

  Future<void> _fetchAuthHeaders() async {
    final headers = await _apiService.getAuthHeaders();
    if (mounted) {
      setState(() {
        _authHeaders = headers;
      });
    }
  }

  Future<void> _fetchPropertyDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _apiService.getPropertyById(widget.propertyId);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (response.isSuccess) {
          _property = response.data;
        } else {
          _error = response.error ?? 'Failed to load property details';
        }
      });
    }
  }

  Future<void> _uploadMedia() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image == null) return;

      setState(() => _isLoading = true);

      final bytes = await image.readAsBytes();
      final response = await _apiService.uploadPropertyMedia(
        widget.propertyId,
        bytes,
        image.name,
      );

      if (response.isSuccess) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Media uploaded successfully!'),
                backgroundColor: Colors.green),
          );
        }
        await _fetchPropertyDetails();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(response.error ?? 'Upload failed'),
                backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('An unexpected error occurred: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _getImageUrl(String mediaId) {
    return '${ApiService.baseUrl}/download/property-media/$mediaId';
  }

  String _getProfileImageUrl(String userId) {
    return '${ApiService.baseUrl}/download/user-profile/$userId';
  }

  String _formatCurrency(num amount) {
    final format = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
    return format.format(amount);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : _buildMainContent(),
      floatingActionButton: (_property != null && _property!.type == 'BUILDING')
          ? FloatingActionButton.extended(
              onPressed: () async {
                final result = await Navigator.pushNamed(
                  context,
                  '/add-unit',
                  arguments: {
                    'propertyId': _property!.id,
                    'propertyTitle': _property!.title,
                  },
                );

                if (result == true) {
                  _fetchPropertyDetails();
                }
              },
              label:
                  const Text('Add Unit', style: TextStyle(color: Colors.white)),
              icon: const Icon(Icons.add, color: Colors.white),
              backgroundColor: Colors.indigo,
            )
          : null,
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(_error!, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _fetchPropertyDetails,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildMainContent() {
    final property = _property!;
    return CustomScrollView(
      slivers: [
        _buildSliverAppBar(property),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderInfo(property),
                const SizedBox(height: 16),
                _buildDetailsSection(property),
                const SizedBox(height: 24),
                _buildUnitsSection(property),
                const SizedBox(height: 80), // Space for FAB
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSliverAppBar(Property property) {
    final mediaItems = property.media ?? [];
    return SliverAppBar(
      expandedHeight: 300,
      pinned: true,
      flexibleSpace: FlexibleSpaceBar(
        background: mediaItems.isEmpty
            ? Container(
                color: Colors.grey[300],
                child:
                    const Icon(Icons.business, size: 100, color: Colors.white),
              )
            : PageView.builder(
                itemCount: mediaItems.length,
                itemBuilder: (context, index) {
                  final media = mediaItems[index];
                  if (media.mediaType == 'IMAGE') {
                    return CachedNetworkImage(
                      imageUrl: _getImageUrl(media.id),
                      httpHeaders: _authHeaders,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: Colors.grey[100],
                        child: const Center(child: CircularProgressIndicator()),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: Colors.grey[200],
                        child:
                            const Icon(Icons.broken_image, color: Colors.grey),
                      ),
                    );
                  } else {
                    return Container(
                      color: Colors.indigo[50],
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.description,
                              size: 64, color: Colors.indigo),
                          const SizedBox(height: 8),
                          Text(media.description ?? 'Document',
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold)),
                          Text(media.mediaType,
                              style: const TextStyle(color: Colors.grey)),
                        ],
                      ),
                    );
                  }
                },
              ),
      ),
      actions: [
        if (_property != null) ...[
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      EditPropertyScreen(property: _property!),
                ),
              );
              if (result == true) {
                _fetchPropertyDetails();
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
            onPressed: () => _confirmDelete(),
          ),
        ],
        IconButton(
          icon: const Icon(Icons.file_upload_outlined),
          onPressed: _uploadMedia,
        ),
      ],
    );
  }

  Widget _buildHeaderInfo(Property property) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                property.title,
                style:
                    const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            ),
            _buildStatusChip(property.status),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
            const SizedBox(width: 4),
            Text(
              '${property.addressCity}, ${property.addressSubCity}',
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.indigo[50],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            property.type,
            style: const TextStyle(
                color: Colors.indigo, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailsSection(Property property) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Details',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: Colors.grey[200]!,
              width: 1, // Optional: defaults to 1.0
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: property.type == 'BUILDING'
                ? _buildBuildingDetails(property.buildingDetails ?? {})
                : _buildVehicleDetails(property.vehicleDetails ?? {}),
          ),
        ),
      ],
    );
  }

  Widget _buildBuildingDetails(Map<String, dynamic> details) {
    return Column(
      children: [
        _buildDetailRow(Icons.layers, 'Total Floors',
            details['totalFloors']?.toString() ?? 'N/A'),
        _buildDetailRow(Icons.elevator, 'Elevator',
            (details['hasElevator'] ?? false) ? 'Yes' : 'No'),
        _buildDetailRow(Icons.local_parking, 'Parking',
            (details['hasParking'] ?? false) ? 'Yes' : 'No'),
        _buildDetailRow(Icons.security, 'Security',
            (details['hasSecurity'] ?? false) ? 'Yes' : 'No'),
        _buildDetailRow(Icons.calendar_today, 'Year Built',
            details['yearBuilt']?.toString() ?? 'N/A'),
      ],
    );
  }

  Widget _buildVehicleDetails(Map<String, dynamic> details) {
    return Column(
      children: [
        _buildDetailRow(
            Icons.directions_car, 'Brand', details['brand'] ?? 'N/A'),
        _buildDetailRow(
            Icons.model_training, 'Model', details['model'] ?? 'N/A'),
        _buildDetailRow(Icons.confirmation_number, 'Plate Number',
            details['plateNumber'] ?? 'N/A'),
        _buildDetailRow(Icons.settings, 'Transmission',
            details['transmissionType'] ?? 'N/A'),
        _buildDetailRow(
            Icons.local_gas_station, 'Fuel Type', details['fuelType'] ?? 'N/A'),
        _buildDetailRow(
            Icons.speed, 'Horse Power', details['engineCapacity'] ?? 'N/A'),
      ],
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.indigo[300]),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: Colors.grey[600])),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildUnitsSection(Property property) {
    if (property.type != 'BUILDING') return const SizedBox.shrink();
    final units = property.rentalUnits ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Rental Units',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        if (units.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24.0),
            child: Center(child: Text('No rental units added yet.')),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: units.length,
            itemBuilder: (context, index) {
              final unit = units[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  title: Text(unit.unitIdentifier,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(_formatCurrency(unit.rentAmount)),
                  trailing: _buildStatusChip(unit.status),
                  onTap: () async {
                    final result = await Navigator.pushNamed(
                      context,
                      '/unit-detail',
                      arguments: unit.id,
                    );
                    if (result == true) {
                      _fetchPropertyDetails();
                    }
                  },
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'VACANT':
        color = Colors.green;
        break;
      case 'OCCUPIED':
        color = Colors.blue;
        break;
      case 'MAINTENANCE':
        color = Colors.orange;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        status,
        style:
            TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }

  Future<void> _confirmDelete() async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Property'),
        content: const Text(
          'Are you sure you want to delete this property? This action cannot be undone and will fail if there are active rental units or leases.',
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
      _deleteProperty();
    }
  }

  Future<void> _deleteProperty() async {
    setState(() => _isLoading = true);
    final response = await _apiService.deleteProperty(widget.propertyId);

    if (mounted) {
      if (response.isSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Property deleted successfully')),
        );
        // Pop back to dashboard
        Navigator.pop(context, true);
      } else {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Delete failed: ${response.error}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
