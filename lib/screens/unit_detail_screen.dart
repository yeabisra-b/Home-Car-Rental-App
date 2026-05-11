import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import '../models/lease.dart';
import '../models/rental_unit.dart';
import 'edit_unit_screen.dart';

class UnitDetailScreen extends StatefulWidget {
  final String unitId;

  const UnitDetailScreen({super.key, required this.unitId});

  @override
  State<UnitDetailScreen> createState() => _UnitDetailScreenState();
}

class _UnitDetailScreenState extends State<UnitDetailScreen> {
  final ApiService _apiService = ApiService();
  RentalUnit? _unit;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchUnitDetails();
  }

  Future<void> _fetchUnitDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _apiService.getUnitById(widget.unitId);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (response.isSuccess) {
          _unit = response.data;
        } else {
          _error = response.error ?? 'Failed to load unit details';
        }
      });
    }
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
            onPressed: _fetchUnitDetails,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildMainContent() {
    final unit = _unit!;
    return CustomScrollView(
      slivers: [
        _buildSliverAppBar(unit),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderInfo(unit),
                const SizedBox(height: 16),
                _buildDetailsSection(unit),
                const SizedBox(height: 24),
                if (unit.amenities != null && unit.amenities!.isNotEmpty)
                  _buildAmenitiesSection(unit),
                const SizedBox(height: 24),
                _buildLeaseSection(unit),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSliverAppBar(RentalUnit unit) {
    return SliverAppBar(
      expandedHeight: 120,
      pinned: true,
      backgroundColor: Colors.indigo,
      flexibleSpace: FlexibleSpaceBar(
        title: Text(unit.unitIdentifier,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold)),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.indigo, Colors.indigoAccent],
            ),
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.edit_outlined, color: Colors.white),
          onPressed: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => EditUnitScreen(unit: unit),
              ),
            );
            if (result == true) {
              _fetchUnitDetails();
            }
          },
        ),
        IconButton(
          icon: const Icon(Icons.delete_outline, color: Colors.white),
          onPressed: _confirmDelete,
        ),
      ],
    );
  }

  Widget _buildHeaderInfo(RentalUnit unit) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildStatusChip(unit.status),
            Text(
              _formatCurrency(unit.rentAmount),
              style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.indigo),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (unit.description != null && unit.description!.isNotEmpty)
          Text(
            unit.description!,
            style:
                TextStyle(fontSize: 16, color: Colors.grey[700], height: 1.5),
          ),
      ],
    );
  }

  Widget _buildDetailsSection(RentalUnit unit) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Specifications',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                _buildInfoRow(Icons.king_bed_outlined, 'Bedrooms',
                    unit.bedrooms?.toString() ?? 'N/A'),
                const Divider(),
                _buildInfoRow(Icons.bathtub_outlined, 'Bathrooms',
                    unit.bathrooms?.toString() ?? 'N/A'),
                const Divider(),
                _buildInfoRow(
                    Icons.square_foot,
                    'Area',
                    unit.areaSqMeters != null
                        ? '${unit.areaSqMeters} m²'
                        : 'N/A'),
                const Divider(),
                _buildInfoRow(Icons.layers_outlined, 'Floor Number',
                    unit.floorNumber?.toString() ?? 'N/A'),
                if (unit.depositAmount != null) ...[
                  const Divider(),
                  _buildInfoRow(Icons.savings_outlined, 'Security Deposit',
                      _formatCurrency(unit.depositAmount!)),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
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

  Widget _buildAmenitiesSection(RentalUnit unit) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Amenities',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: unit.amenities!.map((amenity) {
            return Chip(
              label: Text(amenity, style: const TextStyle(fontSize: 12)),
              backgroundColor: Colors.indigo[50],
              side: BorderSide.none,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20)),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toUpperCase()) {
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        status.toUpperCase(),
        style:
            TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12),
      ),
    );
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Unit'),
        content: const Text(
            'Are you sure you want to delete this unit? This action cannot be undone and will affect associated active leases.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);
      final response = await _apiService.deleteRentalUnit(_unit!.id);
      if (mounted) {
        setState(() => _isLoading = false);
        if (response.isSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Unit deleted successfully'),
                backgroundColor: Colors.green),
          );
          Navigator.pop(context, true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(response.error ?? 'Failed to delete unit'),
                backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  // ─────────────────────── LEASE MANAGEMENT ───────────────────────

  Widget _buildLeaseSection(RentalUnit unit) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Lease Management',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        // Check for existing lease FIRST — unit.status may still be VACANT while lease is DRAFT
        if (unit.currentLease != null)
          _buildCurrentLeaseCard(unit.currentLease!)
        else if (unit.status == 'VACANT')
          _buildCreateLeasePrompt()
        else
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text('No active lease. Unit is ${unit.status}.',
                  style: TextStyle(color: Colors.grey[600])),
            ),
          ),
      ],
    );
  }

  Widget _buildCreateLeasePrompt() {
    return Card(
      color: Colors.indigo[50],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Icon(Icons.assignment_add, size: 48, color: Colors.indigo),
            const SizedBox(height: 16),
            const Text(
                'This unit is vacant. Create a new lease to start the rental process.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.indigo)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _showCreateLeaseModal,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Create Lease',
                  style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentLeaseCard(Lease lease) {
    final statusUpper = lease.status.toUpperCase();
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Lease #${lease.id.substring(0, 8)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                Chip(
                  label: Text(statusUpper,
                      style:
                          const TextStyle(color: Colors.white, fontSize: 12)),
                  backgroundColor:
                      statusUpper == 'ACTIVE' ? Colors.green : Colors.orange,
                ),
              ],
            ),
            const Divider(),
            _buildInfoRow(
                Icons.email_outlined, 'Tenant ID', lease.tenantId ?? 'Unknown'),
            _buildInfoRow(
                Icons.calendar_today,
                'Start',
                lease.startDate != null
                    ? DateFormat('MMM d, yyyy').format(lease.startDate!)
                    : 'N/A'),
            _buildInfoRow(
                Icons.event_available,
                'End',
                lease.endDate != null
                    ? DateFormat('MMM d, yyyy').format(lease.endDate!)
                    : 'N/A'),
            _buildInfoRow(Icons.attach_money, 'Rent',
                _formatCurrency(lease.monthlyRent ?? 0)),
            if (statusUpper == 'DRAFT') ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _uploadLeaseDocument(lease.id),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.upload_file, color: Colors.white),
                  label: const Text('Upload Signed Document',
                      style: TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                  'Uploading the signed document will activate the lease.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Colors.grey)),
            ]
          ],
        ),
      ),
    );
  }

  void _showCreateLeaseModal() {
    final emailController = TextEditingController();
    final rentController =
        TextEditingController(text: _unit!.rentAmount.toString());
    final depositController =
        TextEditingController(text: _unit!.depositAmount?.toString() ?? '');
    DateTime startDate = DateTime.now();
    DateTime endDate = DateTime.now().add(const Duration(days: 365));
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              left: 24,
              right: 24,
              top: 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Create Lease',
                      style:
                          TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
                  TextField(
                    controller: emailController,
                    decoration: const InputDecoration(
                      labelText: 'Tenant Email',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.email),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: rentController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Monthly Rent',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.attach_money),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: depositController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Deposit Amount',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.savings),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    title: const Text('Start Date'),
                    subtitle: Text(DateFormat('MMM d, yyyy').format(startDate)),
                    trailing: const Icon(Icons.calendar_today),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: startDate,
                        firstDate:
                            DateTime.now().subtract(const Duration(days: 30)),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null) setModalState(() => startDate = date);
                    },
                  ),
                  ListTile(
                    title: const Text('End Date'),
                    subtitle: Text(DateFormat('MMM d, yyyy').format(endDate)),
                    trailing: const Icon(Icons.event_available),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: endDate,
                        firstDate: startDate,
                        lastDate: startDate.add(const Duration(days: 365 * 10)),
                      );
                      if (date != null) setModalState(() => endDate = date);
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: isSubmitting
                          ? null
                          : () async {
                              final email = emailController.text.trim();
                              final rent =
                                  num.tryParse(rentController.text) ?? 0;
                              final deposit =
                                  num.tryParse(depositController.text) ?? 0;
                              if (email.isEmpty || rent <= 0) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'Please fill all required fields correctly.')),
                                );
                                return;
                              }
                              setModalState(() => isSubmitting = true);
                              final res = await _apiService.createLease(
                                unitId: _unit!.id,
                                tenantEmail: email,
                                startDate: startDate,
                                endDate: endDate,
                                monthlyRent: rent,
                                depositAmount: deposit,
                              );
                              if (mounted) {
                                if (res.isSuccess) {
                                  Navigator.pop(context);
                                  _fetchUnitDetails();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content:
                                            Text('Lease created successfully!'),
                                        backgroundColor: Colors.green),
                                  );
                                } else {
                                  setModalState(() => isSubmitting = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content: Text(res.error ??
                                            'Failed to create lease'),
                                        backgroundColor: Colors.red),
                                  );
                                }
                              }
                            },
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigo),
                      child: isSubmitting
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Create Draft Lease',
                              style:
                                  TextStyle(color: Colors.white, fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _uploadLeaseDocument(String leaseId) async {
    try {
      FilePickerResult? result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );

      if (result != null && result.files.single.path != null) {
        setState(() => _isLoading = true);
        final fileBytes = await File(result.files.single.path!).readAsBytes();

        final res = await _apiService.uploadLeaseDocument(
          leaseId: leaseId,
          fileBytes: fileBytes,
          fileName: result.files.single.name,
        );

        if (mounted) {
          setState(() => _isLoading = false);
          if (res.isSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('Lease document uploaded and activated!'),
                  backgroundColor: Colors.green),
            );
            _fetchUnitDetails();
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text(res.error ?? 'Failed to upload document'),
                  backgroundColor: Colors.red),
            );
          }
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }
}
