// lib/screens/Chat/views/chat_list_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Chat/models/conversation_model.dart';
import 'package:wiz/screens/Chat/services/chat_service.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/utils/bottom_nav_bar.dart';
import 'package:intl/intl.dart';
import 'dart:async';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ChatService _chatService = ChatService();

  List<ConversationModel> _conversations = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _totalUnreadCount = 0;
  StreamSubscription? _messageSubscription;
  StreamSubscription? _unreadCountSubscription;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    // Initialize chat service (connect socket)
    await _chatService.initialize();

    // Load conversations
    await _loadConversations();

    // Load unread count
    _loadUnreadCount();

    // Listen to real-time events
    _setupRealtimeListeners();
  }

  void _setupRealtimeListeners() {
    // Listen for new messages
    _messageSubscription = _chatService.messageStream.listen((data) {
      print('📩 New message received in list');
      // Refresh conversation list when new message arrives
      _loadConversations();
    });

    // Listen for unread count updates
    _unreadCountSubscription = _chatService.unreadCountStream.listen((data) {
      setState(() {
        _totalUnreadCount = data['totalUnreadCount'] ?? 0;
      });
    });
  }

  Future<void> _loadConversations() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final conversations = await _chatService.getConversations();

      if (mounted) {
        setState(() {
          _conversations = conversations;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadUnreadCount() async {
    final count = await _chatService.getTotalUnreadCount();
    if (mounted) {
      setState(() {
        _totalUnreadCount = count;
      });
    }
  }

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return '';

    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inDays == 0) {
      // Today - show time
      return DateFormat('h:mm a').format(dateTime);
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return DateFormat('EEEE').format(dateTime); // Day name
    } else {
      return DateFormat('MMM d').format(dateTime);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Row(
          children: [
            Text('Messages', style: AppStyles.h2(context)),
            if (_totalUnreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$_totalUnreadCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        centerTitle: true,
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
                  color: isConnected ? Colors.green : Colors.grey,
                  size: 12,
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: AppStyles.inputDecoration(
                hint: 'Search conversations',
                icon: Icons.search,
                context: context,
              ),
              onChanged: (value) {
                // TODO: Implement search
              },
            ),
          ),

          // Chat list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                ? _buildErrorState()
                : _conversations.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _loadConversations,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _conversations.length,
                      itemBuilder: (context, index) {
                        final conversation = _conversations[index];
                        return _buildConversationItem(conversation);
                      },
                    ),
                  ),
          ),
        ],
      ),
      bottomNavigationBar: ButtonNavBar(),
    );
  }

  Widget _buildConversationItem(ConversationModel conversation) {
    return GestureDetector(
      onTap: () async {
        // Navigate to chat detail
        await Navigator.pushNamed(
          context,
          AppRoutes.chatDetail,
          arguments: conversation,
        );

        // Refresh list when coming back
        _loadConversations();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppStyles.surface(context),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            // Avatar
            Stack(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundImage: AssetImage(conversation.displayAvatar),
                ),
                // Online indicator
                StreamBuilder<Map<String, dynamic>>(
                  stream: _chatService.onlineStatusStream,
                  builder: (context, snapshot) {
                    final isOnline =
                        snapshot.data?['userId'] == conversation.otherUserId &&
                        snapshot.data?['status'] == 'online';

                    if (!isOnline) return const SizedBox.shrink();

                    return Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppStyles.surface(context),
                            width: 2,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(width: 12),

            // Name and message
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          conversation.displayName,
                          style: AppStyles.h3(context),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        _formatTime(conversation.lastMessageAt),
                        style: AppStyles.caption(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.lastMessage?.content ??
                              'No messages yet',
                          style: AppStyles.caption(context).copyWith(
                            fontWeight: conversation.unreadCount > 0
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.unreadCount > 0) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppStyles.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${conversation.unreadCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: AppStyles.textSecondary(context),
          ),
          const SizedBox(height: 16),
          Text('No conversations yet', style: AppStyles.h3(context)),
          const SizedBox(height: 8),
          Text(
            'Start chatting when you book a vehicle',
            style: AppStyles.caption(context),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text('Failed to load conversations', style: AppStyles.h3(context)),
          const SizedBox(height: 8),
          Text(
            _errorMessage ?? 'Unknown error',
            style: AppStyles.caption(context),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadConversations,
            style: AppStyles.primaryButtonStyle(context),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    _messageSubscription?.cancel();
    _unreadCountSubscription?.cancel();
    super.dispose();
  }
}
