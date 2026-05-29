class Invoice {
  final String id;
  final String? leaseId;
  final DateTime? billingMonth;
  final double? amountDue;
  final DateTime? dueDate;
  final String status; // UNPAID, PENDING_REVIEW, PAID, OVERDUE
  final String? reviewNote;

  Invoice({
    required this.id,
    this.leaseId,
    this.billingMonth,
    this.amountDue,
    this.dueDate,
    required this.status,
    this.reviewNote,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    // Check for single-resource response envelope
    final Map<String, dynamic> data = json.containsKey('invoice') ? json['invoice'] : json;

    return Invoice(
      id: data['id'] as String,
      leaseId: data['leaseId'] as String?,
      billingMonth: data['billingMonth'] != null
          ? DateTime.parse(data['billingMonth']).toUtc()
          : null,
      amountDue: data['amountDue'] != null ? double.tryParse(data['amountDue'].toString()) : null,
      dueDate: data['dueDate'] != null
          ? DateTime.parse(data['dueDate']).toUtc()
          : null,
      status: data['status'] as String? ?? 'UNPAID',
      reviewNote: data['reviewNote'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'leaseId': leaseId,
      'billingMonth': billingMonth?.toIso8601String().split('T').first, // ISO date format for month
      'amountDue': amountDue,
      'dueDate': dueDate?.toIso8601String().split('T').first,
      'status': status,
      'reviewNote': reviewNote,
    };
  }
}
