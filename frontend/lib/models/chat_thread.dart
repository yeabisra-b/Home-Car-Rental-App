import 'package:intl/intl.dart';

/// Represents a single conversation thread in the marketplace inbox.
/// Threads are context-bound: each is linked to a specific [propertyId]
/// and two participants.
class ChatThread {
  final String chatId;
  final String? propertyId;
  final String propertyTitle;
  final String? propertyPrice; // Formatted string, e.g. "From $1,200/mo"
  final String? propertyType; // BUILDING or VEHICLE
  final String? propertyOwnerId; // The owner of the property
  final String otherPartyId;
  final String otherPartyName;
  final String lastMessage;
  final DateTime time;
  final bool unread;

  ChatThread({
    required this.chatId,
    this.propertyId,
    required this.propertyTitle,
    this.propertyPrice,
    this.propertyType,
    this.propertyOwnerId,
    required this.otherPartyId,
    required this.otherPartyName,
    required this.lastMessage,
    required this.time,
    required this.unread,
  });

  /// Returns true if the current user is the buyer (not the property owner)
  /// in this conversation.
  bool isBuying(String currentUserId) => propertyOwnerId != currentUserId;

  /// Returns true if the current user is the seller (property owner)
  /// in this conversation.
  bool isSelling(String currentUserId) => propertyOwnerId == currentUserId;

  factory ChatThread.fromJson(Map<String, dynamic> json, String currentUserId) {
    // Resolve the other participant
    final participantA = json['participantA'] as Map<String, dynamic>?;
    final participantB = json['participantB'] as Map<String, dynamic>?;

    Map<String, dynamic>? otherUserData;
    if (participantA != null && participantA['id']?.toString() != currentUserId) {
      otherUserData = participantA;
    } else if (participantB != null && participantB['id']?.toString() != currentUserId) {
      otherUserData = participantB;
    } else {
      otherUserData = participantA; // fallback
    }

    final String otherPartyId = otherUserData?['id']?.toString() ?? '';
    final String firstName = otherUserData?['firstName']?.toString() ?? '';
    final String lastName = otherUserData?['lastName']?.toString() ?? '';
    final String otherPartyName = '${firstName.trim()} ${lastName.trim()}'.trim();

    // Parse property context
    final property = json['property'] as Map<String, dynamic>?;
    final String propertyTitle = property?['title']?.toString() ?? 'Unknown Property';
    final String? propertyId = property?['id']?.toString();
    final String? propertyOwnerId = property?['ownerId']?.toString();
    final String? propertyType = property?['type']?.toString();

    // Derive formatted price from nested rentalUnits
    String? propertyPrice;
    final rawUnits = property?['rentalUnits'];
    if (rawUnits is List && rawUnits.isNotEmpty) {
      final amounts = rawUnits
          .map((u) {
            final raw = u['rentAmount'];
            if (raw == null) return null;
            return num.tryParse(raw.toString());
          })
          .whereType<num>()
          .toList();

      if (amounts.isNotEmpty) {
        amounts.sort();
        final formatter = NumberFormat.currency(symbol: '\$', decimalDigits: 0);
        if (amounts.length == 1) {
          propertyPrice = '${formatter.format(amounts.first)}/mo';
        } else {
          propertyPrice = 'From ${formatter.format(amounts.first)}/mo';
        }
      }
    }

    // Parse last message
    final lastMsg = json['lastMessage'] as Map<String, dynamic>?;
    final String lastMessage =
        lastMsg?['content']?.toString() ?? 'No messages yet';

    // Determine unread status
    bool isUnread = false;
    if (lastMsg != null) {
      final isSender = lastMsg['senderId']?.toString() == currentUserId;
      isUnread = !isSender && lastMsg['readAt'] == null;
    }

    // Determine time
    DateTime time;
    try {
      if (lastMsg != null && lastMsg['createdAt'] != null) {
        time = DateTime.parse(lastMsg['createdAt']).toLocal();
      } else {
        time = DateTime.parse(
          json['updatedAt'] ?? DateTime.now().toIso8601String(),
        ).toLocal();
      }
    } catch (_) {
      time = DateTime.now();
    }

    return ChatThread(
      chatId: json['id']?.toString() ?? '',
      propertyId: propertyId,
      propertyTitle: propertyTitle,
      propertyPrice: propertyPrice,
      propertyType: propertyType,
      propertyOwnerId: propertyOwnerId,
      otherPartyId: otherPartyId,
      otherPartyName: otherPartyName.isNotEmpty ? otherPartyName : 'Unknown User',
      lastMessage: lastMessage,
      time: time,
      unread: isUnread,
    );
  }
}
