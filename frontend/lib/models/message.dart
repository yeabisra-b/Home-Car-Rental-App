import 'user.dart';

class AppMessage {
  final String id;
  final String senderId;
  final String receiverId;
  final String subject;
  final String content;
  final DateTime? readAt;
  final DateTime createdAt;
  final User? sender;
  final User? receiver;

  AppMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.subject,
    required this.content,
    this.readAt,
    required this.createdAt,
    this.sender,
    this.receiver,
  });

  factory AppMessage.fromJson(Map<String, dynamic> json) {
    final data = json.containsKey('message') ? json['message'] : json;
    return AppMessage(
      id: data['id']?.toString() ?? '',
      senderId: data['senderId']?.toString() ?? '',
      receiverId: data['receiverId']?.toString() ?? '',
      subject: data['subject']?.toString() ?? '',
      content: data['content']?.toString() ?? '',
      readAt: data['readAt'] != null ? DateTime.parse(data['readAt']).toUtc() : null,
      createdAt: DateTime.parse(data['createdAt'] ?? DateTime.now().toIso8601String()).toUtc(),
      sender: data['sender'] != null ? User.fromJson(data['sender']) : null,
      receiver: data['receiver'] != null ? User.fromJson(data['receiver']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'receiverId': receiverId,
      'subject': subject,
      'content': content,
      'readAt': readAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      if (sender != null) 'sender': sender!.toJson(),
      if (receiver != null) 'receiver': receiver!.toJson(),
    };
  }
}

class ConversationSummary {
  final String id;
  final User otherUser;
  final String propertyTitle;
  final String lastMessage;
  final DateTime time;
  final bool unread;

  ConversationSummary({
    required this.id,
    required this.otherUser,
    required this.propertyTitle,
    required this.lastMessage,
    required this.time,
    required this.unread,
  });

  factory ConversationSummary.fromJson(Map<String, dynamic> json, String currentUserId) {
    // Resolve other user from participantA or participantB
    final participantA = json['participantA'];
    final participantB = json['participantB'];
    
    Map<String, dynamic>? otherUserData;
    if (participantA != null && participantA['id'] != currentUserId) {
      otherUserData = participantA;
    } else if (participantB != null && participantB['id'] != currentUserId) {
      otherUserData = participantB;
    } else {
      otherUserData = participantA; // fallback
    }

    final property = json['property'];
    final lastMsg = json['lastMessage'];

    bool isUnread = false;
    if (lastMsg != null) {
      final isSender = lastMsg['senderId'] == currentUserId;
      isUnread = !isSender && lastMsg['readAt'] == null;
    }

    return ConversationSummary(
      id: json['id']?.toString() ?? '',
      otherUser: otherUserData != null ? User.fromJson(otherUserData) : User(id: 'unknown', email: '', role: '', accountStatus: '', createdAt: DateTime.now()),
      propertyTitle: property != null ? property['title']?.toString() ?? '' : '',
      lastMessage: lastMsg != null ? lastMsg['content']?.toString() ?? 'No messages yet' : 'No messages yet',
      time: lastMsg != null 
          ? DateTime.parse(lastMsg['createdAt']).toUtc() 
          : DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()).toUtc(),
      unread: isUnread,
    );
  }
}

