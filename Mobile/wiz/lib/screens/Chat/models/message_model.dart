// lib/screens/Chat/models/message_model.dart
class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String receiverId;
  final String messageType;
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
    // Helper: read camelCase OR snake_case key
    String str(String camel, String snake) => (json[camel] ?? json[snake] ?? '').toString();

    String? strNull(String camel, String snake) {
      final v = json[camel] ?? json[snake];
      return v?.toString();
    }

    DateTime parseDate(String camel, String snake) {
      final v = json[camel] ?? json[snake];
      if (v == null) return DateTime.now();
      return DateTime.tryParse(v.toString()) ?? DateTime.now();
    }

    return MessageModel(
      id: str('id', 'id'),
      conversationId: str('conversationId', 'conversation_id'),
      senderId: str('senderId', 'sender_id'),
      receiverId: str('receiverId', 'receiver_id'),
      messageType: str('messageType', 'message_type').isEmpty ? 'text' : str('messageType', 'message_type'),
      content: strNull('content', 'content'),
      mediaFileId: strNull('mediaFileId', 'media_file_id'),
      isRead: json['isRead'] ?? json['is_read'] ?? false,
      readAt: json['readAt'] != null
          ? DateTime.tryParse(json['readAt'].toString())
          : json['read_at'] != null
          ? DateTime.tryParse(json['read_at'].toString())
          : null,
      isDeleted: json['isDeleted'] ?? json['is_deleted'] ?? false,
      createdAt: parseDate('createdAt', 'created_at'),
      updatedAt: parseDate('updatedAt', 'updated_at'),
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

  bool isSentByMe(String currentUserId) {
    return senderId == currentUserId;
  }

  String get displayContent {
    if (isDeleted) return 'Message deleted';
    if (messageType == 'text') return content ?? '';
    if (messageType == 'image') return '📷 Image';
    if (messageType == 'document') return '📄 Document';
    return 'Message';
  }

  String get formattedTime {
    final hour = createdAt.hour > 12
        ? createdAt.hour - 12
        : createdAt.hour == 0
        ? 12
        : createdAt.hour;
    final minute = createdAt.minute.toString().padLeft(2, '0');
    final period = createdAt.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute$period';
  }

  String get formattedDate {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDate = DateTime(createdAt.year, createdAt.month, createdAt.day);

    if (messageDate == today) return 'Today';
    if (messageDate == today.subtract(const Duration(days: 1))) return 'Yesterday';
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }

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
