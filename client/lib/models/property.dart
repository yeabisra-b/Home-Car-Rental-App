import 'rental_unit.dart';
import 'property_media.dart';
import 'user.dart';

class Property {
  final String id;
  final String? ownerId;
  final User? owner;
  final String title;
  final String? description;
  final String type; // BUILDING, VEHICLE
  final String status; // ACTIVE, INACTIVE, MAINTENANCE, DELETED
  final String? addressCity;
  final String? addressStreet;
  final String? addressSubCity;
  final String? addressWoreda;
  final String? addressHouseNumber;
  final Map<String, dynamic>? buildingDetails;
  final Map<String, dynamic>? vehicleDetails;
  final List<RentalUnit>? rentalUnits;
  final List<PropertyMedia>? media;
  final DateTime? createdAt;

  Property({
    required this.id,
    this.ownerId,
    this.owner,
    required this.title,
    this.description,
    required this.type,
    required this.status,
    this.addressCity,
    this.addressStreet,
    this.addressSubCity,
    this.addressWoreda,
    this.addressHouseNumber,
    this.buildingDetails,
    this.vehicleDetails,
    this.rentalUnits,
    this.media,
    this.createdAt,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    // Check for single-resource response envelope
    final Map<String, dynamic> data = json.containsKey('property') ? json['property'] : json;

    return Property(
      id: data['id']?.toString() ?? '',
      ownerId: data['ownerId'] as String?,
      owner: data['owner'] != null ? User.fromJson(data['owner']) : null,
      title: data['title']?.toString() ?? '',
      description: data['description'] as String?,
      type: data['type'] as String? ?? 'BUILDING',
      status: data['status'] as String? ?? 'ACTIVE',
      addressCity: data['addressCity'] as String?,
      addressStreet: data['addressStreet'] as String?,
      addressSubCity: data['addressSubCity'] as String?,
      addressWoreda: data['addressWoreda'] as String?,
      addressHouseNumber: data['addressHouseNumber'] as String?,
      buildingDetails: data['buildingDetails'] as Map<String, dynamic>?,
      vehicleDetails: data['vehicleDetails'] as Map<String, dynamic>?,
      rentalUnits: data['rentalUnits'] != null
          ? (data['rentalUnits'] as List<dynamic>)
              .map((e) => RentalUnit.fromJson(e))
              .toList()
          : null,
      media: data['media'] != null
          ? (data['media'] as List<dynamic>)
              .map((e) => PropertyMedia.fromJson(e))
              .toList()
          : null,
      createdAt: data['createdAt'] != null
          ? DateTime.parse(data['createdAt']).toUtc()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ownerId': ownerId,
      'owner': owner?.toJson(),
      'title': title,
      'description': description,
      'type': type,
      'status': status,
      'addressCity': addressCity,
      'addressStreet': addressStreet,
      'addressSubCity': addressSubCity,
      'addressWoreda': addressWoreda,
      'addressHouseNumber': addressHouseNumber,
      'buildingDetails': buildingDetails,
      'vehicleDetails': vehicleDetails,
      'rentalUnits': rentalUnits?.map((e) => e.id).toList(), // Usually just IDs for requests
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
