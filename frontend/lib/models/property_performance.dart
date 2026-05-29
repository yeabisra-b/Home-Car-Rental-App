class PropertyPerformance {
  final String propertyId;
  final String name;
  final num revenue;
  final num occupancy;
  final num change;

  PropertyPerformance({
    required this.propertyId,
    required this.name,
    required this.revenue,
    required this.occupancy,
    required this.change,
  });

  factory PropertyPerformance.fromJson(Map<String, dynamic> json) {
    return PropertyPerformance(
      propertyId: json['propertyId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      revenue: json['revenue'] != null ? num.tryParse(json['revenue'].toString()) ?? 0 : 0,
      occupancy: json['occupancy'] != null ? num.tryParse(json['occupancy'].toString()) ?? 0 : 0,
      change: json['change'] != null ? num.tryParse(json['change'].toString()) ?? 0 : 0,
    );
  }
}
