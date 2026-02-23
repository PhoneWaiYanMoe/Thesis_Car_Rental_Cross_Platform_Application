// lib/screens/Chat/services/chat_service.dart
import 'package:wiz/screens/Chat/services/chat_api_service.dart';
import 'package:wiz/screens/Chat/services/chat_socket_service.dart';
import 'package:wiz/screens/Chat/models/conversation_model.dart';
import 'package:wiz/screens/Chat/models/message_model.dart';
import 'package:wiz/services/local_storage_service.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;
  ChatService._internal();

  final ChatApiService _apiService = ChatApiService();
  final ChatSocketService _socketService = ChatSocketService();
  final LocalStorageService _localStorage = LocalStorageService();

  // Expose socket streams
  Stream<Map<String, dynamic>> get messageStream =>
      _socketService.messageStream;
  Stream<Map<String, dynamic>> get typingStream => _socketService.typingStream;
  Stream<Map<String, dynamic>> get onlineStatusStream =>
      _socketService.onlineStatusStream;
  Stream<Map<String, dynamic>> get messageReadStream =>
      _socketService.messageReadStream;
  Stream<Map<String, dynamic>> get unreadCountStream =>
      _socketService.unreadCountStream;
  Stream<bool> get connectionStream => _socketService.connectionStream;

  bool get isConnected => _socketService.isConnected;

  /// Initialize chat service (connect socket)
  Future<void> initialize() async {
    await _socketService.connect();
  }

  /// Get current user ID
  Future<String?> getCurrentUserId() async {
    final userInfo = await _localStorage.getUserInfo();
    return userInfo['userId'];
  }

  /// Get conversations with enriched data
  Future<List<ConversationModel>> getConversations({
    String status = 'active',
    String search = '',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final result = await _apiService.getConversations(
        status: status,
        search: search,
        page: page,
        limit: limit,
      );

      if (result['success']) {
        final data = result['data'];
        final conversationsJson = data['conversations'] as List;

        final conversations = conversationsJson
            .map((json) => ConversationModel.fromJson(json))
            .toList();

        // TODO: Enrich with user/vehicle data from other services
        // For now, return as is
        return conversations;
      } else {
        throw Exception(result['error'] ?? 'Failed to load conversations');
      }
    } catch (e) {
      print('❌ Get conversations error: $e');
      return [];
    }
  }

  /// Get messages in a conversation
  Future<List<MessageModel>> getMessages(
    String conversationId, {
    int page = 1,
    int limit = 50,
    String? before,
  }) async {
    try {
      final result = await _apiService.getMessages(
        conversationId,
        page: page,
        limit: limit,
        before: before,
      );

      if (result['success']) {
        final data = result['data'];
        final messagesJson = data['messages'] as List;

        final messages = messagesJson
            .map((json) => MessageModel.fromJson(json))
            .toList();

        return messages;
      } else {
        throw Exception(result['error'] ?? 'Failed to load messages');
      }
    } catch (e) {
      print('❌ Get messages error: $e');
      return [];
    }
  }

  /// Send a message (via Socket.IO for real-time)
  void sendMessage({
    required String conversationId,
    required String messageType,
    String? content,
    String? mediaFileId,
  }) {
    if (_socketService.isConnected) {
      // Use socket for real-time
      _socketService.sendMessage(
        conversationId: conversationId,
        messageType: messageType,
        content: content,
        mediaFileId: mediaFileId,
      );
    } else {
      // Fallback to REST API if socket not connected
      print('⚠️ Socket not connected, using REST API');
      _apiService.sendMessage(
        conversationId,
        messageType: messageType,
        content: content,
        mediaFileId: mediaFileId,
      );
    }
  }

  /// Join a conversation room
  void joinConversation(String conversationId) {
    _socketService.joinConversation(conversationId);
  }

  /// Leave a conversation room
  void leaveConversation(String conversationId) {
    _socketService.leaveConversation(conversationId);
  }

  /// Start typing indicator
  void startTyping(String conversationId) {
    _socketService.startTyping(conversationId);
  }

  /// Stop typing indicator
  void stopTyping(String conversationId) {
    _socketService.stopTyping(conversationId);
  }

  /// Mark message as read
  void markMessageAsRead(String messageId) {
    if (_socketService.isConnected) {
      _socketService.markAsRead(messageId);
    } else {
      _apiService.markAsRead(messageId);
    }
  }

  /// Mark all messages as read in conversation
  Future<void> markAllAsRead(String conversationId) async {
    await _apiService.markAllAsRead(conversationId);
  }

  /// Get total unread count
  Future<int> getTotalUnreadCount() async {
    try {
      final result = await _apiService.getTotalUnreadCount();
      if (result['success']) {
        final data = result['data'];
        return data['totalUnreadCount'] ?? 0;
      }
      return 0;
    } catch (e) {
      print('❌ Get unread count error: $e');
      return 0;
    }
  }

  /// Block conversation
  Future<bool> blockConversation(
    String conversationId, {
    String? reason,
  }) async {
    try {
      final result = await _apiService.blockConversation(
        conversationId,
        reason: reason,
      );
      return result['success'] == true;
    } catch (e) {
      print('❌ Block conversation error: $e');
      return false;
    }
  }

  /// Disconnect and cleanup
  void dispose() {
    _socketService.dispose();
  }
}
