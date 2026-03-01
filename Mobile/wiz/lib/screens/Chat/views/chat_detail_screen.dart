// lib/screens/Chat/views/chat_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Chat/models/conversation_model.dart';
import 'package:wiz/screens/Chat/models/message_model.dart';
import 'package:wiz/screens/Chat/services/chat_service.dart';
import 'dart:async';

class ChatDetailScreen extends StatefulWidget {
  final ConversationModel conversation;

  const ChatDetailScreen({super.key, required this.conversation});

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ChatService _chatService = ChatService();

  List<MessageModel> _messages = [];
  bool _isLoading = false;
  String? _currentUserId;
  bool _isTyping = false;
  Timer? _typingTimer;

  StreamSubscription? _messageSubscription;
  StreamSubscription? _typingSubscription;
  StreamSubscription? _messageReadSubscription;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    // Get current user ID FIRST before anything else
    _currentUserId = await _chatService.getCurrentUserId();
    print('👤 Current user ID: $_currentUserId');

    // Join conversation room
    _chatService.joinConversation(widget.conversation.id);

    // Load messages
    await _loadMessages();

    // Setup real-time listeners AFTER messages are loaded
    _setupRealtimeListeners();

    // Mark all as read when entering chat
    await _chatService.markAllAsRead(widget.conversation.id);
  }

  void _setupRealtimeListeners() {
    // Listen for new messages
    _messageSubscription = _chatService.messageStream.listen((data) {
      final message = MessageModel.fromJson(data['message']);

      // Only add if it's for this conversation
      if (message.conversationId != widget.conversation.id) return;

      // FIX: Prevent duplicate messages by checking if message ID already exists
      final alreadyExists = _messages.any((m) => m.id == message.id);
      if (alreadyExists) {
        print('⚠️ Duplicate message ignored: ${message.id}');
        return;
      }

      setState(() {
        _messages.add(message);
      });

      // Scroll to bottom
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

      // Mark as read if received from other user
      if (message.senderId != _currentUserId) {
        _chatService.markMessageAsRead(message.id);
      }
    });

    // Listen for typing indicators
    _typingSubscription = _chatService.typingStream.listen((data) {
      if (data['conversationId'] == widget.conversation.id && data['userId'] != _currentUserId) {
        setState(() {
          _isTyping = data['isTyping'] ?? false;
        });
      }
    });

    // Listen for message read receipts
    _messageReadSubscription = _chatService.messageReadStream.listen((data) {
      if (data['conversationId'] == widget.conversation.id) {
        setState(() {
          final messageIndex = _messages.indexWhere((m) => m.id == data['messageId']);
          if (messageIndex != -1) {
            _messages[messageIndex] = _messages[messageIndex].copyWith(
              isRead: true,
              readAt: DateTime.tryParse(data['readAt'] ?? ''),
            );
          }
        });
      }
    });
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);

    try {
      final messages = await _chatService.getMessages(widget.conversation.id);

      if (mounted) {
        setState(() {
          _messages = messages;
          _isLoading = false;
        });

        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load messages: $e')));
      }
    }
  }

  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    _messageController.clear();

    // Stop typing indicator
    _chatService.stopTyping(widget.conversation.id);
    setState(() => _isTyping = false);
    _typingTimer?.cancel();

    // Send via socket — the server will broadcast new_message back to ALL
    // members in the room (including sender), so we do NOT add locally here.
    // The messageStream listener will add it when the server echoes it back.
    _chatService.sendMessage(conversationId: widget.conversation.id, messageType: 'text', content: content);
  }

  void _onTextChanged(String text) {
    _typingTimer?.cancel();

    if (text.isNotEmpty) {
      _chatService.startTyping(widget.conversation.id);
    }

    _typingTimer = Timer(const Duration(seconds: 2), () {
      _chatService.stopTyping(widget.conversation.id);
    });
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            _chatService.leaveConversation(widget.conversation.id);
            Navigator.pop(context);
          },
        ),
        title: Row(
          children: [
            CircleAvatar(radius: 20, backgroundImage: AssetImage(widget.conversation.displayAvatar)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.conversation.displayName, style: AppStyles.h3(context)),
                  // Typing or online status
                  if (_isTyping)
                    Text(
                      'typing...',
                      style: AppStyles.caption(
                        context,
                      ).copyWith(fontSize: 12, color: AppStyles.primary, fontStyle: FontStyle.italic),
                    )
                  else
                    StreamBuilder<Map<String, dynamic>>(
                      stream: _chatService.onlineStatusStream,
                      builder: (context, snapshot) {
                        final isOnline =
                            snapshot.data?['userId'] == widget.conversation.otherUserId &&
                            snapshot.data?['status'] == 'online';
                        return Text(
                          isOnline ? 'Online' : 'Offline',
                          style: AppStyles.caption(context).copyWith(fontSize: 12),
                        );
                      },
                    ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: AppStyles.background(context),
        elevation: 0,
        actions: [
          StreamBuilder<bool>(
            stream: _chatService.connectionStream,
            initialData: _chatService.isConnected,
            builder: (context, snapshot) {
              final isConnected = snapshot.data ?? false;
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Icon(Icons.circle, color: isConnected ? Colors.green : Colors.red, size: 12),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                ? Center(
                    child: Text(
                      'No messages yet\nSay hi! 👋',
                      style: AppStyles.caption(context),
                      textAlign: TextAlign.center,
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      final showDate = index == 0 || _messages[index - 1].formattedDate != message.formattedDate;

                      return Column(
                        children: [
                          if (showDate)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              child: Text(message.formattedDate, style: AppStyles.caption(context)),
                            ),
                          _buildMessageBubble(message),
                        ],
                      );
                    },
                  ),
          ),

          // Message input
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppStyles.background(context),
              border: Border(top: BorderSide(color: AppStyles.textSecondary(context).withOpacity(0.2))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Send a message',
                      hintStyle: AppStyles.caption(context),
                      filled: true,
                      fillColor: AppStyles.surface(context),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                    style: AppStyles.body(context),
                    onChanged: _onTextChanged,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(color: AppStyles.primary, shape: BoxShape.circle),
                    child: const Icon(Icons.send, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(MessageModel message) {
    // FIX: Guard against null currentUserId — default to empty string
    // so messages won't incorrectly appear on the wrong side
    final isSentByMe = _currentUserId != null && message.isSentByMe(_currentUserId!);
    print('🔍 senderId=${message.senderId} currentUserId=$_currentUserId match=${message.senderId == _currentUserId}');

    return Align(
      alignment: isSentByMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar only for received messages
          if (!isSentByMe)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: CircleAvatar(radius: 16, backgroundImage: AssetImage(widget.conversation.displayAvatar)),
            ),

          Flexible(
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isSentByMe ? AppStyles.primary : AppStyles.surface(context),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isSentByMe ? 16 : 4),
                  bottomRight: Radius.circular(isSentByMe ? 4 : 16),
                ),
              ),
              child: Column(
                crossAxisAlignment: isSentByMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  Text(
                    message.displayContent,
                    style: AppStyles.body(
                      context,
                    ).copyWith(color: isSentByMe ? Colors.white : AppStyles.textPrimary(context)),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        message.formattedTime,
                        style: TextStyle(
                          fontSize: 11,
                          color: isSentByMe ? Colors.white70 : AppStyles.textSecondary(context),
                        ),
                      ),
                      if (isSentByMe) ...[
                        const SizedBox(width: 4),
                        Icon(
                          message.isRead ? Icons.done_all : Icons.done,
                          size: 14,
                          color: message.isRead ? Colors.lightBlueAccent : Colors.white70,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Spacer for sent messages (to push bubble left of send button area)
          if (isSentByMe) const SizedBox(width: 8),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();
    _messageSubscription?.cancel();
    _typingSubscription?.cancel();
    _messageReadSubscription?.cancel();
    _chatService.leaveConversation(widget.conversation.id);
    super.dispose();
  }
}
