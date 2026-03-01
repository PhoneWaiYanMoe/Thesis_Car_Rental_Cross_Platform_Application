// lib/screens/Chat/services/chat_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:wiz/services/local_storage_service.dart';

class ChatApiService {
  //static const String baseUrl = 'http://localhost:3011'; // chat-service
  static const String baseUrl = 'http://206.189.147.242'; // Production URL
  // static const String baseUrl = 'http://10.0.2.2:3011'; // For Android emulator

  final _localStorageService = LocalStorageService();

  /// Get auth token
  Future<String?> _getAuthToken() async {
    try {
      final token = await _localStorageService.getToken();
      return token;
    } catch (e) {
      print('❌ Error getting auth token: $e');
      return null;
    }
  }

  /// Get user's conversations
  Future<Map<String, dynamic>> getConversations({
    String status = 'active',
    String search = '',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final queryParams = {
        'status': status,
        if (search.isNotEmpty) 'search': search,
        'page': page.toString(),
        'limit': limit.toString(),
      };

      final uri = Uri.parse('$baseUrl/chat/conversations').replace(queryParameters: queryParams);

      print('📋 Fetching conversations: $uri');

      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      );

      print('📥 Conversations response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data};
      } else {
        final errorData = jsonDecode(response.body);
        return {'success': false, 'error': errorData['message'] ?? 'Failed to load conversations'};
      }
    } catch (e) {
      print('❌ Get conversations error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Get messages in a conversation
  Future<Map<String, dynamic>> getMessages(
    String conversationId, {
    int page = 1,
    int limit = 50,
    String? before,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final queryParams = {'page': page.toString(), 'limit': limit.toString(), if (before != null) 'before': before};

      final uri = Uri.parse(
        '$baseUrl/chat/conversations/$conversationId/messages',
      ).replace(queryParameters: queryParams);

      print('💬 Fetching messages: $uri');

      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      );

      print('📥 Messages response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data};
      } else {
        final errorData = jsonDecode(response.body);
        return {'success': false, 'error': errorData['message'] ?? 'Failed to load messages'};
      }
    } catch (e) {
      print('❌ Get messages error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Send a message (REST API - for backup/offline)
  Future<Map<String, dynamic>> sendMessage(
    String conversationId, {
    required String messageType,
    String? content,
    String? mediaFileId,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      print('📤 Sending message to $conversationId');

      final response = await http.post(
        Uri.parse('$baseUrl/chat/conversations/$conversationId/messages'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({
          'messageType': messageType,
          if (content != null) 'content': content,
          if (mediaFileId != null) 'mediaFileId': mediaFileId,
        }),
      );

      print('📥 Send message response: ${response.statusCode}');

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data};
      } else {
        final errorData = jsonDecode(response.body);
        return {'success': false, 'error': errorData['message'] ?? 'Failed to send message'};
      }
    } catch (e) {
      print('❌ Send message error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Mark message as read
  Future<Map<String, dynamic>> markAsRead(String messageId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/chat/messages/$messageId/read'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'error': 'Failed to mark as read'};
      }
    } catch (e) {
      print('❌ Mark as read error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Mark all messages in conversation as read
  Future<Map<String, dynamic>> markAllAsRead(String conversationId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/chat/conversations/$conversationId/read-all'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'error': 'Failed to mark all as read'};
      }
    } catch (e) {
      print('❌ Mark all as read error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Get total unread count
  Future<Map<String, dynamic>> getTotalUnreadCount() async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl/chat/conversations/unread/count'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': 'Failed to get unread count'};
      }
    } catch (e) {
      print('❌ Get unread count error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Block conversation
  Future<Map<String, dynamic>> blockConversation(String conversationId, {String? reason}) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final response = await http.post(
        Uri.parse('$baseUrl/chat/conversations/$conversationId/block'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({if (reason != null) 'reason': reason}),
      );

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'error': 'Failed to block conversation'};
      }
    } catch (e) {
      print('❌ Block conversation error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }
}
