import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import '../models/dashboard_stats.dart';
import '../models/property_performance.dart';
import '../models/maintenance_request.dart';
import 'register_property.dart';
import 'owner_property_list.dart';
import 'profile_screen.dart';
import 'profile_settings_shells.dart';
import 'inbox_screen.dart';

class OwnerDashboard extends StatefulWidget {
  const OwnerDashboard({super.key});

  @override
  _OwnerDashboardState createState() => _OwnerDashboardState();
}

class _OwnerDashboardState extends State<OwnerDashboard> {
  final ApiService _apiService = ApiService();

  bool _isLoading = true;
  String? _error;

  DashboardStats? _stats;
  List<PropertyPerformance> _topProperties = [];
  List<MaintenanceRequest> _urgentRequests = [];
  User? _user;
  Map<String, String> _authHeaders = {};

  int _selectedIndex = 0;

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
      // Fetch headers first for images
      final headers = await _apiService.getAuthHeaders();
      if (mounted) {
        setState(() {
          _authHeaders = headers;
        });
      }

      final statsResponse = await _apiService.getOwnerStats();
      final performanceResponse = await _apiService.getPropertyPerformance();
      final requestsResponse = await _apiService.getUrgentMaintenanceRequests();
      final profileResponse = await _apiService.getProfile();

      if (statsResponse.isSuccess) {
        _stats = statsResponse.data;
      } else {
        _error = statsResponse.error ?? 'Failed to load stats';
      }

      if (performanceResponse.isSuccess) {
        _topProperties = performanceResponse.data ?? [];
      }

      if (requestsResponse.isSuccess) {
        _urgentRequests = requestsResponse.data ?? [];
      }

      if (profileResponse.isSuccess) {
        _user = profileResponse.data;
      }
    } catch (e) {
      _error = 'An unexpected error occurred: $e';
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    // TODO: Implement actual navigation to other screens when built
  }

  String _formatCurrency(num amount) {
    final format = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
    return format.format(amount);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.indigo,
        title: Text(
          _getAppBarTitle(),
          style:
              const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        actions: [
          _buildProfileIcon(),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        selectedItemColor: Colors.indigo,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(
              icon: Icon(Icons.business), label: 'Properties'),
          BottomNavigationBarItem(icon: Icon(Icons.message), label: 'Messages'),
        ],
      ),
      floatingActionButton: _selectedIndex == 1
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (context) => const RegisterPropertyScreen()),
                ).then((_) => _fetchData());
              },
              backgroundColor: Colors.indigo,
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text(
                "Add Property",
                style: TextStyle(color: Colors.white),
              ))
          : null,
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildDashboardOverview();
      case 1:
        return const OwnerPropertyListScreen();
      case 2:
        return InboxScreen(currentUserId: _user?.id, primaryColor: Colors.indigo, isSeller: true);
      default:
        return Center(
            child: Text('Screen for index $_selectedIndex coming soon'));
    }
  }

  String _getAppBarTitle() {
    switch (_selectedIndex) {
      case 0:
        return 'Overview';
      case 1:
        return 'My Properties';
      case 2:
        return 'Leases';
      case 3:
        return 'Messages';
      default:
        return 'RPMS';
    }
  }

  Widget _buildDashboardOverview() {
    if (_isLoading && _stats == null) {
      return const Center(child: CircularProgressIndicator());
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
            ElevatedButton(
              onPressed: _fetchData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_stats != null && _stats!.propertiesCount == 0) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _fetchData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_stats != null) _buildStatsGrid(),
            const SizedBox(height: 24),
            _buildQuickActions(),
            const SizedBox(height: 24),
            if (_urgentRequests.isNotEmpty) ...[
              _buildSectionHeader('Needs Attention',
                  Icons.warning_amber_rounded, Colors.orange),
              const SizedBox(height: 12),
              _buildUrgentRequestsList(),
              const SizedBox(height: 24),
            ],
            _buildSectionHeader(
              'Performing Properties',
              Icons.trending_up,
              Colors.green,
              onViewAll: () {
                setState(() {
                  _selectedIndex = 1;
                });
              },
            ),
            const SizedBox(height: 10),
            _buildPropertyPerformanceList(),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.home_work_outlined, size: 100, color: Colors.grey[400]),
          const SizedBox(height: 24),
          const Text(
            'Welcome to RPMS!',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Text(
            'You haven\'t registered any properties yet.',
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Register Your First Property'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              textStyle:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (context) => const RegisterPropertyScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Dynamically compute aspect ratio so cards are never too short
        final cardWidth = (constraints.maxWidth - 16) / 2;
        final aspectRatio = (cardWidth / 110).clamp(1.1, 2.0);
        return GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: aspectRatio,
          children: [
            _buildStatCard('Revenue MTD', _formatCurrency(_stats!.revenueMTD),
                Icons.attach_money, Colors.green),
            _buildStatCard('Occupancy Rate', '${_stats!.occupancyRate}%',
                Icons.pie_chart, Colors.blue),
            _buildStatCard('Total Properties', _stats!.propertiesCount.toString(),
                Icons.business, Colors.indigo),
            _buildStatCard('Total Units', _stats!.unitsCount.toString(),
                Icons.meeting_room, Colors.purple),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        icon: const Icon(Icons.add_business),
        label: const Text(
          'Register Property',
          overflow: TextOverflow.ellipsis,
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.indigo[50],
          foregroundColor: Colors.indigo,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
                builder: (context) => const RegisterPropertyScreen()),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, Color iconColor,
      {VoidCallback? onViewAll}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: iconColor, size: 24),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87),
            ),
          ],
        ),
        if (onViewAll != null)
          TextButton(
            onPressed: onViewAll,
            child: const Text('View All',
                style: TextStyle(
                    color: Colors.indigo, fontWeight: FontWeight.bold)),
          ),
      ],
    );
  }

  Widget _buildUrgentRequestsList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _urgentRequests.length,
      itemBuilder: (context, index) {
        final request = _urgentRequests[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: const CircleAvatar(
              backgroundColor: Colors.redAccent,
              child: Icon(Icons.build, color: Colors.white, size: 20),
            ),
            title: Text(
              request.category ?? 'Maintenance Request',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              request.description ?? 'No description provided',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Navigate to request details
            },
          ),
        );
      },
    );
  }

  Widget _buildPropertyPerformanceList() {
    if (_topProperties.isEmpty) {
      return const Text('No performance data available yet.');
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _topProperties.length,
      itemBuilder: (context, index) {
        final property = _topProperties[index];
        final isPositive = property.change >= 0;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.indigo[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.apartment, color: Colors.indigo[400]),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      property.name,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${property.occupancy}% Occupied',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatCurrency(property.revenue),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                        size: 14,
                        color: isPositive ? Colors.green : Colors.red,
                      ),
                      Text(
                        '${property.change.abs()}%',
                        style: TextStyle(
                          color: isPositive ? Colors.green : Colors.red,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProfileIcon() {
    if (_user == null) {
      return const Padding(
        padding: EdgeInsets.all(8.0),
        child: CircleAvatar(
          backgroundColor: Colors.white24,
          child: Icon(Icons.person, color: Colors.white),
        ),
      );
    }

    // Derive the image URL from the same base URL used by the rest of the app
    // so it works on physical devices, not just the Android emulator.
    final String imageUrl =
        '${ApiService.baseUrl}/download/user-profile/${_user!.id}';
    final String initials =
        '${_user!.firstName?[0] ?? ''}${_user!.lastName?[0] ?? ''}'
            .toUpperCase();

    return PopupMenuButton<String>(
      onSelected: (value) async {
        switch (value) {
          case 'profile':
            Navigator.push(context,
                MaterialPageRoute(builder: (context) => const ProfileScreen()));
            break;
          case 'settings':
            Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (context) => const SettingsScreen()));
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
                Navigator.of(context)
                    .pushNamedAndRemoveUntil('/auth', (route) => false);
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
        padding: const EdgeInsets.all(8.0),
        child: CircleAvatar(
          backgroundColor: Colors.white24,
          child: _user!.profilePictureUrl != null
              ? ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    httpHeaders: _authHeaders,
                    placeholder: (context, url) =>
                        const CircularProgressIndicator(strokeWidth: 2),
                    errorWidget: (context, url, error) => Text(
                      initials.isNotEmpty ? initials : '?',
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                    fit: BoxFit.cover,
                    width: 40,
                    height: 40,
                  ),
                )
              : Text(
                  initials.isNotEmpty ? initials : '?',
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold),
                ),
        ),
      ),
    );
  }
}
