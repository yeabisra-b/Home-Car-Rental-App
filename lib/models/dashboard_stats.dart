class DashboardStats {
  final int propertiesCount;
  final int unitsCount;
  final num occupancyRate;
  final int activeLeasesCount;
  final int urgentRequestsCount;
  final num revenueMTD;

  DashboardStats({
    required this.propertiesCount,
    required this.unitsCount,
    required this.occupancyRate,
    required this.activeLeasesCount,
    required this.urgentRequestsCount,
    required this.revenueMTD,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      propertiesCount: json['propertiesCount'] as int? ?? 0,
      unitsCount: json['unitsCount'] as int? ?? 0,
      occupancyRate: json['occupancyRate'] != null ? num.tryParse(json['occupancyRate'].toString()) ?? 0 : 0,
      activeLeasesCount: json['activeLeasesCount'] as int? ?? 0,
      urgentRequestsCount: json['urgentRequestsCount'] as int? ?? 0,
      revenueMTD: json['revenueMTD'] != null ? num.tryParse(json['revenueMTD'].toString()) ?? 0 : 0,
    );
  }
}
