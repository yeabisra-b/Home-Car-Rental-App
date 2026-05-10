class PropertyMedia {
  final String id;
  final String? propertyId;
  final String? url;
  final String mediaType; // IMAGE, PDF, VIDEO
  final String? description;
  final bool isPrimary;

  PropertyMedia({
    required this.id,
    this.propertyId,
    this.url,
    required this.mediaType,
    this.description,
    required this.isPrimary,
  });

  factory PropertyMedia.fromJson(Map<String, dynamic> json) {
    return PropertyMedia(
      id: json['id'] as String,
      propertyId: json['propertyId'] as String?,
      url: json['url'] as String?,
      mediaType: json['mediaType'] as String? ?? 'IMAGE',
      description: json['description'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
    );
  }
}
