import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import '../models/tenant_stats.dart';
import '../models/lease.dart';
import '../models/invoice.dart';
import '../models/maintenance_request.dart';
import '../models/paginated_response.dart';
import 'profile_screen.dart';
import 'tenant_messages_screen.dart';
import 'tenant_browse_screen.dart';
import 'profile_settings_shells.dart';

class TenantDashboard extends StatefulWidget {
  const TenantDashboard({super.key});

  @override
  State<TenantDashboard> createState() => _TenantDashboardState();
}

class _TenantDashboardState extends State<TenantDashboard> {
  final ApiService _apiService = ApiService();

  int _selectedIndex = 0;
  bool _isLoading = true;
  String? _error;

  TenantStats? _stats;
  List<Lease> _leases = [];
  List<Invoice> _invoices = [];
  List<MaintenanceRequest> _requests = [];
  User? _user;
  Map<String, String> _authHeaders = {};

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final headers = await _apiService.getAuthHeaders();
      if (mounted) {
        setState(() {
          _authHeaders = headers;
        });
      }

      final results = await Future.wait([
        _apiService.getTenantStats(),
        _apiService.getLeases(),
        _apiService.getInvoices(limit: 5),
        _apiService.getMaintenanceRequests(limit: 5),
        _apiService.getProfile(),
      ]);

      if (mounted) {
        setState(() {
          final statsRes = results[0] as dynamic;
          if (statsRes.isSuccess) _stats = statsRes.data;

          final leasesRes = results[1] as dynamic;
          if (leasesRes.isSuccess) {
            _leases = (leasesRes.data as PaginatedResponse<Lease>).data;
          }

          final invoicesRes = results[2] as dynamic;
          if (invoicesRes.isSuccess) {
            _invoices = (invoicesRes.data as PaginatedResponse<Invoice>).data;
          }

          final requestsRes = results[3] as dynamic;
          if (requestsRes.isSuccess) {
            _requests = (requestsRes.data as PaginatedResponse<MaintenanceRequest>).data;
          }

          final profileRes = results[4] as dynamic;
          if (profileRes.isSuccess) _user = profileRes.data;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = 'Failed to load data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onItemTapped(int index) => setState(() => _selectedIndex = index);

  String _getAppBarTitle() {
    switch (_selectedIndex) {
      case 0: return 'Overview';
      case 1: return 'My Lease';
      case 2: return 'Messages';
      case 3: return 'Browse';
      default: return 'RPMS';
    }
  }

  @override
  Widget build(BuildContext context) {
    // Safety check for hot reload if tabs were removed
    if (_selectedIndex >= 4) {
      _selectedIndex = 3;
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.teal,
        title: Text(_getAppBarTitle(),
            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        actions: [_buildProfileIcon()],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        selectedItemColor: Colors.teal,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Overview'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'My Lease'),
          BottomNavigationBarItem(icon: Icon(Icons.mail_outline), label: 'Messages'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Browse'),
        ],
      ),
    );
  }

  Widget _buildProfileIcon() {
    if (_user == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 12),
        child: CircleAvatar(
          radius: 16,
          backgroundColor: Colors.white24,
          child: Icon(Icons.person, color: Colors.white, size: 18),
        ),
      );
    }

    final String host = Platform.isAndroid ? '10.0.2.2' : 'localhost';
    final String imageUrl =
        'http://$host:3000/api/v1/download/user-profile/${_user!.id}';
    final String initials =
        '${_user!.firstName?[0] ?? ''}${_user!.lastName?[0] ?? ''}'
            .toUpperCase();

    return PopupMenuButton<String>(
      onSelected: (value) async {
        switch (value) {
          case 'profile':
            _navigateToProfile();
            break;
          case 'settings':
            Navigator.push(context,
                MaterialPageRoute(builder: (context) => const SettingsScreen(themeColor: Colors.teal)));
            break;
          case 'logout':
            final confirm = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Logout'),
                content: const Text('Are you sure you want to log out?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Cancel'),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: TextButton.styleFrom(foregroundColor: Colors.red),
                    child: const Text('Logout'),
                  ),
                ],
              ),
            );
            if (confirm == true) {
              await _apiService.logout();
              if (mounted) {
                Navigator.of(context).pushNamedAndRemoveUntil('/auth', (route) => false);
              }
            }
            break;
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem(
            value: 'profile',
            child: ListTile(
                leading: Icon(Icons.person_outline),
                title: Text('View Profile'))),
        const PopupMenuItem(
            value: 'settings',
            child: ListTile(
                leading: Icon(Icons.settings_outlined),
                title: Text('Settings'))),
        const PopupMenuDivider(),
        const PopupMenuItem(
            value: 'logout',
            child: ListTile(
                leading: Icon(Icons.logout, color: Colors.red),
                title: Text('Logout', style: TextStyle(color: Colors.red)))),
      ],
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: CircleAvatar(
          radius: 16,
          backgroundColor: Colors.white24,
          child: _user!.profilePictureUrl != null
              ? ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    httpHeaders: _authHeaders,
                    placeholder: (context, url) => const SizedBox(
                        width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.teal)),
                    errorWidget: (context, url, error) => Text(
                      initials.isNotEmpty ? initials : '?',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    fit: BoxFit.cover,
                    width: 32,
                    height: 32,
                  ),
                )
              : Text(
                  initials.isNotEmpty ? initials : '?',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
        ),
      ),
    );
  }

  void _navigateToProfile() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const ProfileScreen(themeColor: Colors.teal)),
    ).then((_) => _fetchData());
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0: return _buildOverview();
      case 1: return _buildLeasesTab();
      case 2: return TenantMessagesScreen(currentUserId: _user?.id);
      case 3: return const TenantBrowseScreen();
      default: return const SizedBox.shrink();
    }
  }

  // ─────────────────────── OVERVIEW TAB ───────────────────────

  Widget _buildOverview() {
    if (_isLoading && _stats == null) {
      return const Center(child: CircularProgressIndicator(color: Colors.teal));
    }
    if (_error != null && _stats == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _fetchData, child: const Text('Retry')),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: Colors.teal,
      onRefresh: _fetchData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildWelcomeBanner(),
            const SizedBox(height: 20),
            if (_stats != null) _buildStatsGrid(),
            const SizedBox(height: 24),
            _buildActiveLeaseSummary(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeBanner() {
    final name = _user?.firstName ?? 'Tenant';
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.teal, Color(0xFF00897B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Welcome back, $name!',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(
                  _leases.isEmpty
                      ? 'Find your next home.'
                      : 'You have ${_leases.length} active lease(s).',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                if (_leases.isEmpty) ...[
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () => setState(() => _selectedIndex = 3),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.search, color: Colors.white, size: 16),
                          SizedBox(width: 6),
                          Text('Browse Properties',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const Icon(Icons.home, color: Colors.white30, size: 60),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    final stats = _stats!;
    final daysColor = stats.daysUntilDue <= 3 ? Colors.red : Colors.teal;
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5,
      children: [
        _buildStatCard('Monthly Rent',
            NumberFormat.currency(symbol: '\$', decimalDigits: 0).format(stats.currentRentAmount),
            Icons.attach_money, Colors.teal),
        _buildStatCard('Days Until Due',
            stats.daysUntilDue.toString(), Icons.event, daysColor),
        _buildStatCard('Pending Requests',
            stats.pendingRequestsCount.toString(), Icons.build, Colors.orange),
        _buildStatCard('Unread Messages',
            stats.unreadMessagesCount.toString(), Icons.message, Colors.blue),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 8),
            Expanded(child: Text(title,
                style: TextStyle(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.w500),
                overflow: TextOverflow.ellipsis)),
          ]),
          const Spacer(),
          Text(value,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, Color color,
      {VoidCallback? onViewAll}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 8),
          Text(title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ]),
        if (onViewAll != null)
          TextButton(
            onPressed: onViewAll,
            child: const Text('View All',
                style: TextStyle(color: Colors.teal, fontWeight: FontWeight.bold)),
          ),
      ],
    );
  }

  Widget _buildActiveLeaseSummary() {
    if (_leases.isEmpty) return const SizedBox.shrink();
    final lease = _leases.first;
    final endDate = lease.endDate != null
        ? DateFormat('MMM d, yyyy').format(lease.endDate!)
        : 'N/A';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Active Lease', Icons.assignment_turned_in, Colors.teal),
        const SizedBox(height: 12),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildLeaseInfoRow(Icons.calendar_today, 'Lease Ends', endDate),
                const Divider(),
                _buildLeaseInfoRow(Icons.attach_money, 'Monthly Rent',
                    NumberFormat.currency(symbol: '\$').format(lease.monthlyRent ?? 0)),
                const Divider(),
                _buildLeaseInfoRow(Icons.info_outline, 'Status', lease.status),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLeaseInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.teal[300]),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: Colors.grey[600])),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  // ─────────────────────── LEASE TAB ───────────────────────

  Widget _buildLeasesTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Colors.teal));
    }
    if (_leases.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_outlined, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text('No active leases', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: Colors.teal,
      onRefresh: _fetchData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _leases.length,
        itemBuilder: (context, index) => _buildLeaseDetailCard(_leases[index]),
      ),
    );
  }

  Widget _buildLeaseDetailCard(Lease lease) {
    final statusColor = lease.status == 'ACTIVE' ? Colors.teal : (lease.status == 'DRAFT' ? Colors.orange : Colors.grey);
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Lease #${lease.id.substring(0, 8)}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.4)),
                  ),
                  child: Text(lease.status,
                      style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildLeaseInfoRow(Icons.calendar_today, 'Start Date',
                lease.startDate != null ? DateFormat('MMM d, yyyy').format(lease.startDate!) : 'N/A'),
            const SizedBox(height: 8),
            _buildLeaseInfoRow(Icons.event_available, 'End Date',
                lease.endDate != null ? DateFormat('MMM d, yyyy').format(lease.endDate!) : 'N/A'),
            const SizedBox(height: 8),
            _buildLeaseInfoRow(Icons.attach_money, 'Monthly Rent',
                NumberFormat.currency(symbol: '\$').format(lease.monthlyRent ?? 0)),
            const SizedBox(height: 8),
            _buildLeaseInfoRow(Icons.security, 'Deposit',
                NumberFormat.currency(symbol: '\$').format(lease.depositAmount ?? 0)),
            if (lease.status == 'DRAFT') ...[
              const SizedBox(height: 16),
              const Text('This lease is pending owner signature. Once signed, it will become active.',
                  style: TextStyle(color: Colors.orange, fontStyle: FontStyle.italic)),
            ] else if (lease.status == 'ACTIVE') ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _submitMoveOutNotice(lease.id),
                      icon: const Icon(Icons.exit_to_app, color: Colors.teal),
                      label: const Text('Move-Out Notice', style: TextStyle(color: Colors.teal)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _terminateLease(lease.id),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red[400]),
                      icon: const Icon(Icons.cancel, color: Colors.white),
                      label: const Text('Terminate', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }

  void _submitMoveOutNotice(String leaseId) {
    final noteController = TextEditingController();
    DateTime noticeDate = DateTime.now().add(const Duration(days: 30));
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              left: 24, right: 24, top: 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Move-Out Notice', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
                  ListTile(
                    title: const Text('Move-Out Date'),
                    subtitle: Text(DateFormat('MMM d, yyyy').format(noticeDate)),
                    trailing: const Icon(Icons.calendar_today),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: noticeDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null) setModalState(() => noticeDate = date);
                    },
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: noteController,
                    decoration: const InputDecoration(
                      labelText: 'Additional Note',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: isSubmitting
                          ? null
                          : () async {
                              setModalState(() => isSubmitting = true);
                              final res = await _apiService.submitMoveOutNotice(
                                leaseId: leaseId,
                                noticeDate: noticeDate,
                                note: noteController.text.trim(),
                              );
                              if (mounted) {
                                if (res.isSuccess) {
                                  Navigator.pop(context);
                                  _fetchData();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Notice submitted!'), backgroundColor: Colors.green),
                                  );
                                } else {
                                  setModalState(() => isSubmitting = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(res.error ?? 'Failed to submit notice'), backgroundColor: Colors.red),
                                  );
                                }
                              }
                            },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.teal),
                      child: isSubmitting
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Submit Notice', style: TextStyle(color: Colors.white, fontSize: 16)),
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

  Future<void> _terminateLease(String leaseId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Terminate Lease'),
        content: const Text('Are you sure you want to terminate your lease? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Terminate'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      final res = await _apiService.terminateLease(leaseId: leaseId, reason: 'Terminated by tenant via dashboard');
      if (mounted) {
        if (res.isSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Lease terminated successfully'), backgroundColor: Colors.green),
          );
          _fetchData();
        } else {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(res.error ?? 'Failed to terminate lease'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

}
