class MaintenanceRequest {
  final String id;
  final String? unitId;
  final String? tenantId;
  final String? category;
  final String priority;
  final String? description;
  final String status;
  final DateTime? createdAt;
  final DateTime? resolvedAt;
  final String? note;

  MaintenanceRequest({
    required this.id,
    this.unitId,
    this.tenantId,
    this.category,
    required this.priority,
    this.description,
    required this.status,
    this.createdAt,
    this.resolvedAt,
    this.note,
  });

  factory MaintenanceRequest.fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic> data = json.containsKey('request') ? json['request'] : json;

    return MaintenanceRequest(
      id: data['id']?.toString() ?? '',
      unitId: data['unitId'] as String?,
      tenantId: data['tenantId'] as String?,
      category: data['category'] as String?,
      priority: data['priority'] as String? ?? 'MEDIUM',
      description: data['description'] as String?,
      status: data['status'] as String? ?? 'OPEN',
      createdAt: data['createdAt'] != null ? DateTime.parse(data['createdAt']).toUtc() : null,
      resolvedAt: data['resolvedAt'] != null ? DateTime.parse(data['resolvedAt']).toUtc() : null,
      note: data['note'] as String?,
    );
  }
}
