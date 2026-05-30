class Lease {
  final String id;
  final String? unitId;
  final String? tenantId;
  final DateTime? startDate;
  final DateTime? endDate;
  final double? monthlyRent;
  final double? depositAmount;
  final String status; // DRAFT, ACTIVE, TERMINATED, EXPIRED
  final DateTime? moveOutNoticeDate;

  Lease({
    required this.id,
    this.unitId,
    this.tenantId,
    this.startDate,
    this.endDate,
    this.monthlyRent,
    this.depositAmount,
    required this.status,
    this.moveOutNoticeDate,
  });

  factory Lease.fromJson(Map<String, dynamic> json) {
    // Check for single-resource response envelope
    final Map<String, dynamic> data = json.containsKey('lease') ? json['lease'] : json;

    return Lease(
      id: data['id'] as String,
      unitId: data['unitId'] as String?,
      tenantId: data['tenantId'] as String?,
      startDate: data['startDate'] != null
          ? DateTime.parse(data['startDate']).toUtc()
          : null,
      endDate: data['endDate'] != null
          ? DateTime.parse(data['endDate']).toUtc()
          : null,
      monthlyRent: data['monthlyRent'] != null ? double.tryParse(data['monthlyRent'].toString()) : null,
      depositAmount: data['depositAmount'] != null ? double.tryParse(data['depositAmount'].toString()) : null,
      status: data['status'] as String? ?? 'DRAFT',
      moveOutNoticeDate: data['moveOutNoticeDate'] != null
          ? DateTime.parse(data['moveOutNoticeDate']).toUtc()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'unitId': unitId,
      'tenantId': tenantId,
      'startDate': startDate?.toIso8601String().split('T').first, // Date-only representation
      'endDate': endDate?.toIso8601String().split('T').first,
      'monthlyRent': monthlyRent,
      'depositAmount': depositAmount,
      'status': status,
      'moveOutNoticeDate': moveOutNoticeDate?.toIso8601String().split('T').first,
    };
  }
}
