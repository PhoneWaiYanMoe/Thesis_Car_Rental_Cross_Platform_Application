// lib/screens/Chat/services/chat_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
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

  final Map<String, Map<String, dynamic>> _userProfileCache = {};

  Stream<Map<String, dynamic>> get messageStream => _socketService.messageStream;
  Stream<Map<String, dynamic>> get typingStream => _socketService.typingStream;
  Stream<Map<String, dynamic>> get onlineStatusStream => _socketService.onlineStatusStream;
  Stream<Map<String, dynamic>> get messageReadStream => _socketService.messageReadStream;
  Stream<Map<String, dynamic>> get unreadCountStream => _socketService.unreadCountStream;
  Stream<bool> get connectionStream => _socketService.connectionStream;
  Stream<Map<String, dynamic>> get conversationUpdatedStream => _socketService.conversationUpdatedStream;
  bool get isConnected => _socketService.isConnected;

  /// Initialize chat — always reconnects with the CURRENT user's token.
  /// This ensures switching accounts works without a hot restart.
  Future<void> initialize() async {
    _socketService.disconnect(); // drop stale socket + old auth token
    _userProfileCache.clear(); // clear profiles cached from previous user
    await _socketService.connect(); // reconnect with fresh token from localStorage
  }

  /// Call on logout to cleanly close the socket.
  Future<void> logout() async {
    _socketService.disconnect();
    _userProfileCache.clear();
  }

  /// Always reads fresh from storage so switching accounts is reflected immediately.
  Future<String?> getCurrentUserId() async {
    final userInfo = await _localStorage.getUserInfo();
    return userInfo['userId'];
  }

  Future<Map<String, dynamic>?> _fetchUserProfile(String userId) async {
    if (_userProfileCache.containsKey(userId)) return _userProfileCache[userId];

    try {
      final token = await _localStorage.getToken();
      if (token == null) return null;

      final response = await http
          .get(
            Uri.parse('http://206.189.147.242/users/$userId'),
            headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final profile = data['user'] ?? data;
        _userProfileCache[userId] = profile;
        return profile;
      }
    } catch (e) {
      print('⚠️ Could not fetch profile for $userId: $e');
    }
    return null;
  }

  Future<List<ConversationModel>> getConversations({
    String status = 'active',
    String search = '',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final result = await _apiService.getConversations(status: status, search: search, page: page, limit: limit);

      if (result['success']) {
        final conversationsJson = result['data']['conversations'] as List;
        final conversations = conversationsJson.map((json) => ConversationModel.fromJson(json)).toList();
        return await Future.wait(conversations.map(_enrichConversation));
      } else {
        throw Exception(result['error'] ?? 'Failed to load conversations');
      }
    } catch (e) {
      print('❌ Get conversations error: $e');
      return [];
    }
  }

  Future<ConversationModel> _enrichConversation(ConversationModel conv) async {
    if (conv.otherUserName != null && conv.otherUserName!.isNotEmpty) return conv;

    final profile = await _fetchUserProfile(conv.otherUserId);
    if (profile == null) return conv;

    return ConversationModel(
      id: conv.id,
      bookingId: conv.bookingId,
      vehicleId: conv.vehicleId,
      otherUserId: conv.otherUserId,
      otherUserName: profile['full_name'] ?? profile['fullName'] ?? profile['name'] ?? 'User',
      otherUserAvatar: profile['avatar_url'] ?? profile['avatarUrl'],
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount,
      lastMessageAt: conv.lastMessageAt,
      status: conv.status,
      createdAt: conv.createdAt,
    );
  }

  Future<List<MessageModel>> getMessages(String conversationId, {int page = 1, int limit = 50, String? before}) async {
    try {
      final result = await _apiService.getMessages(conversationId, page: page, limit: limit, before: before);
      if (result['success']) {
        final messagesJson = result['data']['messages'] as List;
        return messagesJson.map((json) => MessageModel.fromJson(json)).toList();
      }
      throw Exception(result['error'] ?? 'Failed to load messages');
    } catch (e) {
      print('❌ Get messages error: $e');
      return [];
    }
  }

  void sendMessage({
    required String conversationId,
    required String messageType,
    String? content,
    String? mediaFileId,
  }) {
    if (_socketService.isConnected) {
      _socketService.sendMessage(
        conversationId: conversationId,
        messageType: messageType,
        content: content,
        mediaFileId: mediaFileId,
      );
    } else {
      print('⚠️ Socket not connected, using REST API');
      _apiService.sendMessage(conversationId, messageType: messageType, content: content, mediaFileId: mediaFileId);
    }
  }

  void joinConversation(String id) => _socketService.joinConversation(id);
  void leaveConversation(String id) => _socketService.leaveConversation(id);
  void startTyping(String id) => _socketService.startTyping(id);
  void stopTyping(String id) => _socketService.stopTyping(id);

  void markMessageAsRead(String messageId) {
    if (_socketService.isConnected) {
      _socketService.markAsRead(messageId);
    } else {
      _apiService.markAsRead(messageId);
    }
  }

  Future<void> markAllAsRead(String conversationId) async => await _apiService.markAllAsRead(conversationId);

  Future<int> getTotalUnreadCount() async {
    try {
      final result = await _apiService.getTotalUnreadCount();
      if (result['success']) return result['data']['totalUnreadCount'] ?? 0;
      return 0;
    } catch (e) {
      return 0;
    }
  }

  Future<bool> blockConversation(String conversationId, {String? reason}) async {
    try {
      final result = await _apiService.blockConversation(conversationId, reason: reason);
      return result['success'] == true;
    } catch (e) {
      return false;
    }
  }

  void clearCache() => _userProfileCache.clear();

  void dispose() {
    _socketService.dispose();
    _userProfileCache.clear();
  }
}
