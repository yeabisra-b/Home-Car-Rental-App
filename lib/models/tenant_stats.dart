class TenantStats {
  final double currentRentAmount;
  final int daysUntilDue;
  final int pendingRequestsCount;
  final int unreadMessagesCount;

  TenantStats({
    required this.currentRentAmount,
    required this.daysUntilDue,
    required this.pendingRequestsCount,
    required this.unreadMessagesCount,
  });

  factory TenantStats.fromJson(Map<String, dynamic> json) {
    return TenantStats(
      currentRentAmount:
          double.tryParse(json['currentRentAmount']?.toString() ?? '0') ?? 0,
      daysUntilDue: json['daysUntilDue'] as int? ?? 0,
      pendingRequestsCount: json['pendingRequestsCount'] as int? ?? 0,
      unreadMessagesCount: json['unreadMessagesCount'] as int? ?? 0,
    );
  }
}
