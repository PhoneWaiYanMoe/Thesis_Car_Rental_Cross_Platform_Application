// lib/screens/Chat/services/chat_socket_service.dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:wiz/services/local_storage_service.dart';
import 'dart:async';

class ChatSocketService {
  //static const String socketUrl = 'http://localhost:3011';
  static const String socketUrl = 'http://206.189.147.242'; // Production URL
  // static const String socketUrl = 'http://10.0.2.2:3011'; // For Android emulator

  IO.Socket? _socket;
  final _localStorageService = LocalStorageService();

  // Stream controllers for real-time events
  final _messageStreamController = StreamController<Map<String, dynamic>>.broadcast();
  final _typingStreamController = StreamController<Map<String, dynamic>>.broadcast();
  final _onlineStatusStreamController = StreamController<Map<String, dynamic>>.broadcast();
  final _messageReadStreamController = StreamController<Map<String, dynamic>>.broadcast();
  final _unreadCountStreamController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionStreamController = StreamController<bool>.broadcast();

  // Getters for streams
  Stream<Map<String, dynamic>> get messageStream => _messageStreamController.stream;
  Stream<Map<String, dynamic>> get typingStream => _typingStreamController.stream;
  Stream<Map<String, dynamic>> get onlineStatusStream => _onlineStatusStreamController.stream;
  Stream<Map<String, dynamic>> get messageReadStream => _messageReadStreamController.stream;
  Stream<Map<String, dynamic>> get unreadCountStream => _unreadCountStreamController.stream;
  Stream<bool> get connectionStream => _connectionStreamController.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// Initialize and connect to Socket.IO server
  Future<void> connect() async {
    try {
      final token = await _localStorageService.getToken();

      if (token == null) {
        print('❌ Cannot connect: No auth token');
        return;
      }

      print('🔌 Connecting to Socket.IO: $socketUrl');

      _socket = IO.io(
        socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .setAuth({'token': token})
            .setPath('/chat/socket.io/') // ← add this
            .build(),
      );
      _setupEventListeners();
      _socket!.connect();
    } catch (e) {
      print('❌ Socket connection error: $e');
      _connectionStreamController.add(false);
    }
  }

  /// Setup all socket event listeners
  void _setupEventListeners() {
    // Connection events
    _socket!.onConnect((_) {
      print('✅ Socket.IO connected');
      _connectionStreamController.add(true);
    });

    _socket!.onDisconnect((_) {
      print('❌ Socket.IO disconnected');
      _connectionStreamController.add(false);
    });

    _socket!.onConnectError((error) {
      print('❌ Connection error: $error');
      _connectionStreamController.add(false);
    });

    // Chat events
    _socket!.on('new_message', (data) {
      print('💬 New message received: ${data['message']['id']}');
      _messageStreamController.add(data);
    });

    _socket!.on('user_typing', (data) {
      print('⌨️ User typing: ${data['userId']}');
      _typingStreamController.add(data);
    });

    _socket!.on('user_online', (data) {
      print('🟢 User online: ${data['userId']}');
      _onlineStatusStreamController.add({...data, 'status': 'online'});
    });

    _socket!.on('user_offline', (data) {
      print('⚫ User offline: ${data['userId']}');
      _onlineStatusStreamController.add({...data, 'status': 'offline'});
    });

    _socket!.on('message_read', (data) {
      print('✓✓ Message read: ${data['messageId']}');
      _messageReadStreamController.add(data);
    });

    _socket!.on('unread_count_updated', (data) {
      print('🔔 Unread count updated: ${data['totalUnreadCount']}');
      _unreadCountStreamController.add(data);
    });

    _socket!.on('joined_conversation', (data) {
      print('✅ Joined conversation: ${data['conversationId']}');
    });

    _socket!.on('error', (error) {
      print('❌ Socket error: $error');
    });
  }

  /// Join a conversation room
  void joinConversation(String conversationId) {
    if (!isConnected) {
      print('❌ Cannot join: Socket not connected');
      return;
    }

    print('🚪 Joining conversation: $conversationId');
    _socket!.emit('join_conversation', {'conversationId': conversationId});
  }

  /// Leave a conversation room
  void leaveConversation(String conversationId) {
    if (!isConnected) return;

    print('🚪 Leaving conversation: $conversationId');
    _socket!.emit('leave_conversation', {'conversationId': conversationId});
  }

  /// Send a message via Socket.IO
  void sendMessage({
    required String conversationId,
    required String messageType,
    String? content,
    String? mediaFileId,
  }) {
    if (!isConnected) {
      print('❌ Cannot send: Socket not connected');
      return;
    }

    print('📤 Sending message via socket');
    _socket!.emit('send_message', {
      'conversationId': conversationId,
      'messageType': messageType,
      if (content != null) 'content': content,
      if (mediaFileId != null) 'mediaFileId': mediaFileId,
    });
  }

  /// Start typing indicator
  void startTyping(String conversationId) {
    if (!isConnected) return;

    _socket!.emit('typing_start', {'conversationId': conversationId});
  }

  /// Stop typing indicator
  void stopTyping(String conversationId) {
    if (!isConnected) return;

    _socket!.emit('typing_stop', {'conversationId': conversationId});
  }

  /// Mark message as read
  void markAsRead(String messageId) {
    if (!isConnected) return;

    print('✓ Marking message as read: $messageId');
    _socket!.emit('mark_as_read', {'messageId': messageId});
  }

  /// Disconnect from Socket.IO
  void disconnect() {
    print('🔌 Disconnecting Socket.IO');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  /// Dispose all resources
  void dispose() {
    disconnect();
    _messageStreamController.close();
    _typingStreamController.close();
    _onlineStatusStreamController.close();
    _messageReadStreamController.close();
    _unreadCountStreamController.close();
    _connectionStreamController.close();
  }
}
