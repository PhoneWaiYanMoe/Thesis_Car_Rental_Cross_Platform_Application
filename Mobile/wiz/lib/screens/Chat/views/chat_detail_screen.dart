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
  String? _typingUserId;
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
    // Get current user ID
    _currentUserId = await _chatService.getCurrentUserId();

    // Join conversation room
    _chatService.joinConversation(widget.conversation.id);

    // Load messages
    await _loadMessages();

    // Setup real-time listeners
    _setupRealtimeListeners();

    // Mark all as read when entering chat
    await _chatService.markAllAsRead(widget.conversation.id);
  }

  void _setupRealtimeListeners() {
    // Listen for new messages
    _messageSubscription = _chatService.messageStream.listen((data) {
      final message = MessageModel.fromJson(data['message']);

      // Only add if it's for this conversation
      if (message.conversationId == widget.conversation.id) {
        setState(() {
          _messages.add(message);
        });

        // Scroll to bottom
        _scrollToBottom();

        // Mark as read if not sent by me
        if (message.senderId != _currentUserId) {
          _chatService.markMessageAsRead(message.id);
        }
      }
    });

    // Listen for typing indicators
    _typingSubscription = _chatService.typingStream.listen((data) {
      if (data['conversationId'] == widget.conversation.id) {
        setState(() {
          _isTyping = data['isTyping'] ?? false;
          _typingUserId = data['userId'];
        });
      }
    });

    // Listen for message read receipts
    _messageReadSubscription = _chatService.messageReadStream.listen((data) {
      if (data['conversationId'] == widget.conversation.id) {
        // Update message read status
        setState(() {
          final messageIndex = _messages.indexWhere(
            (m) => m.id == data['messageId'],
          );
          if (messageIndex != -1) {
            _messages[messageIndex] = _messages[messageIndex].copyWith(
              isRead: true,
              readAt: DateTime.parse(data['readAt']),
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

        // Scroll to bottom after loading
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToBottom();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load messages: $e')));
      }
    }
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    final content = _messageController.text.trim();
    _messageController.clear();

    // Stop typing indicator
    _chatService.stopTyping(widget.conversation.id);

    // Send message via socket
    _chatService.sendMessage(
      conversationId: widget.conversation.id,
      messageType: 'text',
      content: content,
    );

    // Note: Message will be added via messageStream listener
  }

  void _onTextChanged(String text) {
    if (text.isNotEmpty && !_isTyping) {
      // Start typing
      _chatService.startTyping(widget.conversation.id);
      setState(() => _isTyping = true);
    }

    // Reset typing timer
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), () {
      // Stop typing after 2 seconds of inactivity
      _chatService.stopTyping(widget.conversation.id);
      setState(() => _isTyping = false);
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
            // Leave conversation room
            _chatService.leaveConversation(widget.conversation.id);
            Navigator.pop(context);
          },
        ),
        title: Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundImage: AssetImage(widget.conversation.displayAvatar),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.conversation.displayName,
                    style: AppStyles.h3(context),
                  ),
                  // Typing or online status
                  StreamBuilder<Map<String, dynamic>>(
                    stream: _chatService.typingStream,
                    builder: (context, snapshot) {
                      final isTyping =
                          snapshot.data?['conversationId'] ==
                              widget.conversation.id &&
                          snapshot.data?['isTyping'] == true &&
                          snapshot.data?['userId'] != _currentUserId;

                      if (isTyping) {
                        return Text(
                          'typing...',
                          style: AppStyles.caption(context).copyWith(
                            fontSize: 12,
                            color: AppStyles.primary,
                            fontStyle: FontStyle.italic,
                          ),
                        );
                      }

                      return StreamBuilder<Map<String, dynamic>>(
                        stream: _chatService.onlineStatusStream,
                        builder: (context, snapshot) {
                          final isOnline =
                              snapshot.data?['userId'] ==
                                  widget.conversation.otherUserId &&
                              snapshot.data?['status'] == 'online';

                          return Text(
                            isOnline ? 'Online' : 'Offline',
                            style: AppStyles.caption(
                              context,
                            ).copyWith(fontSize: 12),
                          );
                        },
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
          // Connection indicator
          StreamBuilder<bool>(
            stream: _chatService.connectionStream,
            initialData: false,
            builder: (context, snapshot) {
              final isConnected = snapshot.data ?? false;
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Icon(
                  Icons.circle,
                  color: isConnected ? Colors.green : Colors.red,
                  size: 12,
                ),
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
                      final showDate =
                          index == 0 ||
                          _messages[index - 1].formattedDate !=
                              message.formattedDate;

                      return Column(
                        children: [
                          // Date separator
                          if (showDate)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              child: Text(
                                message.formattedDate,
                                style: AppStyles.caption(context),
                              ),
                            ),

                          // Message bubble
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
              border: Border(
                top: BorderSide(
                  color: AppStyles.textSecondary(context).withOpacity(0.2),
                ),
              ),
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
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
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
                    decoration: const BoxDecoration(
                      color: AppStyles.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.send,
                      color: Colors.white,
                      size: 20,
                    ),
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
    final isSentByMe = message.isSentByMe(_currentUserId ?? '');

    return Align(
      alignment: isSentByMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isSentByMe)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: CircleAvatar(
                radius: 16,
                backgroundImage: AssetImage(widget.conversation.displayAvatar),
              ),
            ),

          Flexible(
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isSentByMe
                    ? AppStyles.primary
                    : AppStyles.surface(context),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    message.displayContent,
                    style: AppStyles.body(context).copyWith(
                      color: isSentByMe
                          ? Colors.white
                          : AppStyles.textPrimary(context),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        message.formattedTime,
                        style: TextStyle(
                          fontSize: 11,
                          color: isSentByMe
                              ? Colors.white70
                              : AppStyles.textSecondary(context),
                        ),
                      ),
                      if (isSentByMe) ...[
                        const SizedBox(width: 4),
                        Icon(
                          message.isRead ? Icons.done_all : Icons.done,
                          size: 14,
                          color: message.isRead ? Colors.blue : Colors.white70,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
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

    // Leave conversation room
    _chatService.leaveConversation(widget.conversation.id);

    super.dispose();
  }
}
