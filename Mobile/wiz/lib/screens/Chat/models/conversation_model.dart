// lib/screens/Chat/models/conversation_model.dart
class ConversationModel {
  final String id;
  final String bookingId;
  final String vehicleId;
  final String otherUserId;
  final String? otherUserName; // Will be enriched from user service
  final String? otherUserAvatar;
  final LastMessage? lastMessage;
  final int unreadCount;
  final DateTime? lastMessageAt;
  final String status;
  final DateTime createdAt;

  ConversationModel({
    required this.id,
    required this.bookingId,
    required this.vehicleId,
    required this.otherUserId,
    this.otherUserName,
    this.otherUserAvatar,
    this.lastMessage,
    required this.unreadCount,
    this.lastMessageAt,
    required this.status,
    required this.createdAt,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['id'] ?? '',
      bookingId: json['bookingId'] ?? '',
      vehicleId: json['vehicleId'] ?? '',
      otherUserId: json['otherUserId'] ?? '',
      otherUserName: json['otherUserName'],
      otherUserAvatar: json['otherUserAvatar'],
      lastMessage: json['lastMessage'] != null
          ? LastMessage.fromJson(json['lastMessage'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.parse(json['lastMessageAt'])
          : null,
      status: json['status'] ?? 'active',
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingId': bookingId,
      'vehicleId': vehicleId,
      'otherUserId': otherUserId,
      if (otherUserName != null) 'otherUserName': otherUserName,
      if (otherUserAvatar != null) 'otherUserAvatar': otherUserAvatar,
      if (lastMessage != null) 'lastMessage': lastMessage!.toJson(),
      'unreadCount': unreadCount,
      if (lastMessageAt != null)
        'lastMessageAt': lastMessageAt!.toIso8601String(),
      'status': status,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // Helper to get display name
  String get displayName => otherUserName ?? 'User $otherUserId';

  // Helper to get avatar (fallback to default)
  String get displayAvatar => otherUserAvatar ?? 'assets/images/article_2.png';
}

class LastMessage {
  final String content;
  final String senderId;
  final DateTime timestamp;

  LastMessage({
    required this.content,
    required this.senderId,
    required this.timestamp,
  });

  factory LastMessage.fromJson(Map<String, dynamic> json) {
    return LastMessage(
      content: json['content'] ?? '',
      senderId: json['senderId'] ?? '',
      timestamp: DateTime.parse(
        json['timestamp'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'content': content,
      'senderId': senderId,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
