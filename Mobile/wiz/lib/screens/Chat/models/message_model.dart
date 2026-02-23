// lib/screens/Chat/models/message_model.dart
class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String receiverId;
  final String messageType; // 'text', 'image', 'document'
  final String? content;
  final String? mediaFileId;
  final bool isRead;
  final DateTime? readAt;
  final bool isDeleted;
  final DateTime createdAt;
  final DateTime updatedAt;

  MessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.receiverId,
    required this.messageType,
    this.content,
    this.mediaFileId,
    required this.isRead,
    this.readAt,
    required this.isDeleted,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] ?? '',
      conversationId: json['conversationId'] ?? '',
      senderId: json['senderId'] ?? '',
      receiverId: json['receiverId'] ?? '',
      messageType: json['messageType'] ?? 'text',
      content: json['content'],
      mediaFileId: json['mediaFileId'],
      isRead: json['isRead'] ?? false,
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt']) : null,
      isDeleted: json['isDeleted'] ?? false,
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
      updatedAt: DateTime.parse(
        json['updatedAt'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'receiverId': receiverId,
      'messageType': messageType,
      if (content != null) 'content': content,
      if (mediaFileId != null) 'mediaFileId': mediaFileId,
      'isRead': isRead,
      if (readAt != null) 'readAt': readAt!.toIso8601String(),
      'isDeleted': isDeleted,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // Helper method to check if message is sent by current user
  bool isSentByMe(String currentUserId) {
    return senderId == currentUserId;
  }

  // Helper to get display content
  String get displayContent {
    if (isDeleted) return 'Message deleted';
    if (messageType == 'text') return content ?? '';
    if (messageType == 'image') return '📷 Image';
    if (messageType == 'document') return '📄 Document';
    return 'Message';
  }

  // Helper to format time
  String get formattedTime {
    final hour = createdAt.hour > 12 ? createdAt.hour - 12 : createdAt.hour;
    final minute = createdAt.minute.toString().padLeft(2, '0');
    final period = createdAt.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute$period';
  }

  // Helper to format date
  String get formattedDate {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDate = DateTime(
      createdAt.year,
      createdAt.month,
      createdAt.day,
    );

    if (messageDate == today) {
      return 'Today';
    } else if (messageDate == today.subtract(const Duration(days: 1))) {
      return 'Yesterday';
    } else {
      return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
    }
  }

  // Copy with method for updating message
  MessageModel copyWith({bool? isRead, DateTime? readAt}) {
    return MessageModel(
      id: id,
      conversationId: conversationId,
      senderId: senderId,
      receiverId: receiverId,
      messageType: messageType,
      content: content,
      mediaFileId: mediaFileId,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
      isDeleted: isDeleted,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
