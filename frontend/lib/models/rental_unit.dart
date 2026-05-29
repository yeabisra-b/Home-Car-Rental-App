import 'property.dart';
import 'lease.dart';

class RentalUnit {
  final String id;
  final String propertyId;
  final String unitIdentifier;
  final int? bedrooms;
  final int? bathrooms;
  final num? areaSqMeters;
  final num rentAmount;
  final num? depositAmount;
  final String status;
  final String? description;
  final List<String>? amenities;
  final int? floorNumber;
  final Property? property;
  final Lease? currentLease;

  RentalUnit({
    required this.id,
    required this.propertyId,
    required this.unitIdentifier,
    this.bedrooms,
    this.bathrooms,
    this.areaSqMeters,
    required this.rentAmount,
    this.depositAmount,
    required this.status,
    this.description,
    this.amenities,
    this.floorNumber,
    this.property,
    this.currentLease,
  });

  factory RentalUnit.fromJson(Map<String, dynamic> json) {
    // Check for single-resource response envelope
    final Map<String, dynamic> data =
        json.containsKey('unit') ? json['unit'] : json;

    return RentalUnit(
      id: data['id']?.toString() ?? '',
      propertyId: data['propertyId']?.toString() ?? '',
      unitIdentifier: data['unitIdentifier']?.toString() ?? '',
      bedrooms: data['bedrooms'] as int?,
      bathrooms: data['bathrooms'] as int?,
      areaSqMeters: data['areaSqMeters'] != null
          ? num.tryParse(data['areaSqMeters'].toString())
          : null,
      rentAmount: data['rentAmount'] != null
          ? num.tryParse(data['rentAmount'].toString()) ?? 0
          : 0,
      depositAmount: data['depositAmount'] != null
          ? num.tryParse(data['depositAmount'].toString())
          : null,
      status: data['status'] as String? ?? 'VACANT',
      description: data['description'] as String?,
      amenities: data['amenities'] != null
          ? List<String>.from(data['amenities'])
          : null,
      floorNumber: data['floorNumber'] as int?,
      property:
          data['property'] != null ? Property.fromJson(data['property']) : null,
      currentLease:
          data['currentLease'] != null ? Lease.fromJson(data['currentLease']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'propertyId': propertyId,
      'unitIdentifier': unitIdentifier,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'areaSqMeters': areaSqMeters,
      'rentAmount': rentAmount,
      'depositAmount': depositAmount,
      'status': status,
      'description': description,
      'amenities': amenities,
      'floorNumber': floorNumber,
    };
  }
}
