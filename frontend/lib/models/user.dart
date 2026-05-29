class User {
  final String id;
  final String email;
  final String? firstName;
  final String? middleName;
  final String? lastName;
  final String? phoneNumber;
  final String role; // OWNER, TENANT, ADMIN
  final String accountStatus; // ACTIVE, INACTIVE, SUSPENDED
  final String? profilePictureUrl;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.email,
    this.firstName,
    this.middleName,
    this.lastName,
    this.phoneNumber,
    required this.role,
    required this.accountStatus,
    this.profilePictureUrl,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // Check for single-resource response envelope
    final Map<String, dynamic> data = json.containsKey('user') ? json['user'] : json;

    return User(
      id: data['id']?.toString() ?? '',
      email: data['email']?.toString() ?? '',
      firstName: data['firstName'] as String?,
      middleName: data['middleName'] as String?,
      lastName: data['lastName'] as String?,
      phoneNumber: data['phoneNumber'] as String?,
      role: data['role'] as String? ?? 'TENANT',
      accountStatus: data['accountStatus'] as String? ?? 'ACTIVE',
      profilePictureUrl: data['profilePictureUrl'] as String?,
      createdAt: data['createdAt'] != null
          ? DateTime.parse(data['createdAt']).toUtc()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'middleName': middleName,
      'lastName': lastName,
      'phoneNumber': phoneNumber,
      'role': role,
      'accountStatus': accountStatus,
      'profilePictureUrl': profilePictureUrl,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
