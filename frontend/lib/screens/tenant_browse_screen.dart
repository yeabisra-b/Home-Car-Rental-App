import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/property.dart';
import '../models/rental_unit.dart';
import '../models/property_media.dart';

class TenantBrowseScreen extends StatefulWidget {
  const TenantBrowseScreen({super.key});

  @override
  State<TenantBrowseScreen> createState() => _TenantBrowseScreenState();
}

class _TenantBrowseScreenState extends State<TenantBrowseScreen> {
  final ApiService _apiService = ApiService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  List<Property> _properties = [];
  bool _isLoading = true;
  bool _isFetchingMore = false;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  String? _selectedType;
  String _searchQuery = '';
  Map<String, String>? _authHeaders;

  @override
  void initState() {
    super.initState();
    _fetchAuthHeaders();
    _fetchProperties(refresh: true);
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isFetchingMore &&
        _currentPage < _totalPages) {
      _fetchProperties();
    }
  }

  Future<void> _fetchAuthHeaders() async {
    final headers = await _apiService.getAuthHeaders();
    if (mounted) setState(() => _authHeaders = headers);
  }

  Future<void> _fetchProperties({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _totalPages = 1;
        _properties = [];
        _isLoading = true;
        _error = null;
      });
    } else {
      if (_isFetchingMore) return;
      setState(() => _isFetchingMore = true);
    }

    final response = await _apiService.getProperties(
      page: refresh ? 1 : _currentPage + 1,
      limit: 12,
      type: _selectedType,
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        _isFetchingMore = false;
        if (response.isSuccess) {
          final data = response.data!;
          if (refresh) {
            _properties = data.data;
          } else {
            _properties.addAll(data.data);
            _currentPage++;
          }
          _totalPages = data.totalPages;
        } else {
          _error = response.error ?? 'Failed to load properties';
        }
      });
    }
  }

  String _getImageUrl(String mediaId) {
    return '${ApiService.baseUrl}/download/property-media/$mediaId';
  }

  List<Property> get _filteredProperties {
    if (_searchQuery.isEmpty) return _properties;
    final q = _searchQuery.toLowerCase();
    return _properties.where((p) {
      return p.title.toLowerCase().contains(q) ||
          (p.addressCity?.toLowerCase().contains(q) ?? false) ||
          (p.description?.toLowerCase().contains(q) ?? false);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Browse Properties',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.teal,
        elevation: 0,
      ),
      body: Column(
        children: [
          _buildSearchAndFilter(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      color: Colors.teal,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            onChanged: (v) => setState(() => _searchQuery = v),
            decoration: InputDecoration(
              hintText: 'Search by name, city...',
              hintStyle: TextStyle(color: Colors.grey[400]),
              prefixIcon: const Icon(Icons.search, color: Colors.grey),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: Colors.grey),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                      },
                    )
                  : null,
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('All', null),
                const SizedBox(width: 8),
                _buildFilterChip('Buildings', 'BUILDING'),
                const SizedBox(width: 8),
                _buildFilterChip('Vehicles', 'VEHICLE'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String? type) {
    final isSelected = _selectedType == type;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedType = type);
        _fetchProperties(refresh: true);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.white24,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.teal : Colors.white,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Colors.teal));
    }

    if (_error != null && _properties.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _fetchProperties(refresh: true),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final filtered = _filteredProperties;

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.home_work_outlined, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text('No properties found',
                style: TextStyle(color: Colors.grey[600], fontSize: 16)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: Colors.teal,
      onRefresh: () => _fetchProperties(refresh: true),
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: filtered.length + (_currentPage < _totalPages ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == filtered.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(color: Colors.teal),
              ),
            );
          }
          return _buildPropertyCard(filtered[index]);
        },
      ),
    );
  }

  Widget _buildPropertyCard(Property property) {
    final hasMedia = property.media != null && property.media!.isNotEmpty;
    final primaryMedia = hasMedia
        ? property.media!.firstWhere(
            (m) => m.isPrimary == true,
            orElse: () => property.media!.first,
          )
        : null;

    final vacantCount =
        property.rentalUnits?.where((u) => u.status == 'VACANT').length ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TenantPropertyDetailScreen(
              property: property,
              authHeaders: _authHeaders ?? {},
              getImageUrl: _getImageUrl,
            ),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            SizedBox(
              height: 180,
              width: double.infinity,
              child: primaryMedia != null && _authHeaders != null
                  ? CachedNetworkImage(
                      imageUrl: _getImageUrl(primaryMedia.id),
                      httpHeaders: _authHeaders!,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        color: Colors.grey[200],
                        child: const Center(
                            child: CircularProgressIndicator(strokeWidth: 2)),
                      ),
                      errorWidget: (_, __, ___) =>
                          _buildPlaceholderImage(property),
                    )
                  : _buildPlaceholderImage(property),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          property.title,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.teal[50],
                          borderRadius: BorderRadius.circular(20),
                          border:
                              Border.all(color: Colors.teal.withOpacity(0.3)),
                        ),
                        child: Text(
                          property.type,
                          style: const TextStyle(
                              color: Colors.teal,
                              fontSize: 11,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (property.addressCity != null)
                    Row(children: [
                      Icon(Icons.location_on_outlined,
                          size: 14, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text(
                        property.addressCity ?? '',
                        style: TextStyle(color: Colors.grey[600], fontSize: 13),
                      ),
                    ]),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      if (vacantCount > 0)
                        _buildTag(Icons.meeting_room, '$vacantCount vacant',
                            Colors.green),
                      if (vacantCount > 0) const SizedBox(width: 8),
                      _buildTag(
                          property.type == 'BUILDING'
                              ? Icons.apartment
                              : Icons.directions_car,
                          property.type == 'BUILDING' ? 'Apartment' : 'Vehicle',
                          Colors.indigo),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage(Property property) {
    return Container(
      color: Colors.teal[50],
      child: Center(
        child: Icon(
          property.type == 'VEHICLE' ? Icons.directions_car : Icons.apartment,
          size: 60,
          color: Colors.teal[200],
        ),
      ),
    );
  }

  Widget _buildTag(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 4),
        Text(label,
            style: TextStyle(
                color: color, fontSize: 11, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

// ──────────────────────────────────────────────────────────────
//  TENANT PROPERTY DETAIL VIEW  (read-only)
// ──────────────────────────────────────────────────────────────

class TenantPropertyDetailScreen extends StatelessWidget {
  final Property property;
  final Map<String, String> authHeaders;
  final String Function(String) getImageUrl;

  const TenantPropertyDetailScreen({
    super.key,
    required this.property,
    required this.authHeaders,
    required this.getImageUrl,
  });

  String _formatCurrency(num amount) =>
      NumberFormat.currency(symbol: '\$', decimalDigits: 0).format(amount);

  @override
  Widget build(BuildContext context) {
    final media = property.media ?? [];
    final units = property.rentalUnits ?? [];
    final vacantUnits = units.where((u) => u.status == 'VACANT').toList();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      floatingActionButton: property.ownerId != null
          ? FloatingActionButton.extended(
              onPressed: () => _showMessageSheet(context),
              backgroundColor: Colors.teal,
              icon: const Icon(Icons.chat_bubble_outline, color: Colors.white),
              label: const Text('Contact Owner',
                  style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold)),
            )
          : null,
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(context, media),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeaderSection(),
                  const SizedBox(height: 20),
                  if (property.description != null &&
                      property.description!.isNotEmpty)
                    _buildDescriptionSection(),
                  const SizedBox(height: 20),
                  _buildLocationSection(),
                  const SizedBox(height: 24),
                  if (vacantUnits.isNotEmpty)
                    _buildAvailableUnitsSection(vacantUnits),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showMessageSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _MessageOwnerSheet(
        propertyTitle: property.title,
        ownerId: property.ownerId!,
        propertyId: property.id,
      ),
    );
  }

  Widget _buildSliverAppBar(BuildContext context, List<PropertyMedia> media) {
    return SliverAppBar(
      expandedHeight: 260,
      pinned: true,
      backgroundColor: Colors.teal,
      flexibleSpace: FlexibleSpaceBar(
        background: media.isNotEmpty
            ? PageView.builder(
                itemCount: media.length,
                itemBuilder: (_, i) => CachedNetworkImage(
                  imageUrl: getImageUrl(media[i].id),
                  httpHeaders: authHeaders,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: Colors.grey[200]),
                  errorWidget: (_, __, ___) => _buildPlaceholder(),
                ),
              )
            : _buildPlaceholder(),
      ),
      leading: IconButton(
        icon: const CircleAvatar(
          backgroundColor: Colors.black38,
          child: Icon(Icons.arrow_back, color: Colors.white, size: 20),
        ),
        onPressed: () => Navigator.pop(context),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: Colors.teal[100],
      child: Center(
        child: Icon(
          property.type == 'VEHICLE' ? Icons.directions_car : Icons.apartment,
          size: 80,
          color: Colors.teal[300],
        ),
      ),
    );
  }

  Widget _buildHeaderSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(property.title,
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.teal[50],
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.teal.withOpacity(0.4)),
              ),
              child: Text(property.type,
                  style: const TextStyle(
                      color: Colors.teal,
                      fontWeight: FontWeight.bold,
                      fontSize: 12)),
            ),
          ],
        ),
        if (property.addressCity != null) ...[
          const SizedBox(height: 8),
          Row(children: [
            Icon(Icons.location_on_outlined, size: 16, color: Colors.grey[500]),
            const SizedBox(width: 4),
            Text(
              property.addressCity ?? '',
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
          ]),
        ],
      ],
    );
  }

  Widget _buildDescriptionSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('About this Property',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(property.description!,
            style: TextStyle(color: Colors.grey[700], height: 1.5)),
      ],
    );
  }

  Widget _buildLocationSection() {
    final parts = [
      if (property.addressStreet != null) property.addressStreet!,
      if (property.addressSubCity != null) property.addressSubCity!,
      if (property.addressCity != null) property.addressCity!,
    ];
    if (parts.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Location',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.place, color: Colors.teal, size: 36),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(parts.join(', '),
                      style: const TextStyle(fontSize: 14, height: 1.5)),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAvailableUnitsSection(List<RentalUnit> vacantUnits) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Available Units',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('${vacantUnits.length} vacant',
                  style: const TextStyle(
                      color: Colors.green,
                      fontSize: 12,
                      fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...vacantUnits.map((unit) => _buildUnitCard(unit)),
      ],
    );
  }

  Widget _buildUnitCard(RentalUnit unit) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(unit.unitIdentifier,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                Text(_formatCurrency(unit.rentAmount),
                    style: const TextStyle(
                        color: Colors.teal,
                        fontWeight: FontWeight.bold,
                        fontSize: 18)),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                if (unit.bedrooms != null)
                  _buildUnitSpec(
                      Icons.king_bed_outlined, '${unit.bedrooms} Bed'),
                if (unit.bathrooms != null)
                  _buildUnitSpec(
                      Icons.bathtub_outlined, '${unit.bathrooms} Bath'),
                if (unit.areaSqMeters != null)
                  _buildUnitSpec(Icons.square_foot, '${unit.areaSqMeters} m²'),
                if (unit.floorNumber != null)
                  _buildUnitSpec(
                      Icons.layers_outlined, 'Floor ${unit.floorNumber}'),
              ],
            ),
            if (unit.amenities != null && unit.amenities!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: unit.amenities!
                    .map((a) => Chip(
                          label: Text(a, style: const TextStyle(fontSize: 11)),
                          backgroundColor: Colors.teal[50],
                          side: BorderSide.none,
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                          padding: EdgeInsets.zero,
                        ))
                    .toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildUnitSpec(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Colors.grey[500]),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────
//  MESSAGE OWNER BOTTOM SHEET
// ──────────────────────────────────────────────────────────────

class _MessageOwnerSheet extends StatefulWidget {
  final String propertyTitle;
  final String ownerId;
  final String propertyId;

  const _MessageOwnerSheet({
    required this.propertyTitle,
    required this.ownerId,
    required this.propertyId,
  });

  @override
  State<_MessageOwnerSheet> createState() => _MessageOwnerSheetState();
}

class _MessageOwnerSheetState extends State<_MessageOwnerSheet> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _subjectController;
  final _contentController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _subjectController = TextEditingController(
        text: 'Inquiry regarding: ${widget.propertyTitle}');
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    final response = await _apiService.sendMessage(
      receiverId: widget.ownerId,
      subject: _subjectController.text.trim(),
      content: _contentController.text.trim(),
      propertyId: widget.propertyId,
    );

    setState(() => _isSubmitting = false);

    if (!mounted) return;
    if (response.isSuccess) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Message sent successfully!'),
            backgroundColor: Colors.green),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(response.error ?? 'Failed to send message'),
            backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Contact Owner',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('Send a message to inquire about ${widget.propertyTitle}.',
                  style: TextStyle(color: Colors.grey[600], fontSize: 14)),
              const SizedBox(height: 20),
              TextFormField(
                controller: _subjectController,
                decoration: InputDecoration(
                  labelText: 'Subject',
                  prefixIcon: const Icon(Icons.title),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Subject is required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _contentController,
                decoration: InputDecoration(
                  labelText: 'Message',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                  hintText:
                      'I would like to schedule a viewing or rent this property...',
                ),
                maxLines: 4,
                validator: (v) =>
                    v == null || v.isEmpty ? 'Message cannot be empty' : null,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _sendMessage,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('Send Message',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
