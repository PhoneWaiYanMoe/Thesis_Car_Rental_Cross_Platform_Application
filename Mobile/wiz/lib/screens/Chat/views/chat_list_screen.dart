// Save as: Mobile/wiz/lib/screens/Chat/views/chat_list_screen.dart

import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Chat/models/chat_data.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/utils/bottom_nav_bar.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final TextEditingController _searchController = TextEditingController();
  final List<ChatData> chats = ChatData.getSampleChats();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Messages', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: AppStyles.inputDecoration(
                hint: 'Search',
                icon: Icons.search,
                context: context,
              ),
            ),
          ),
          
          // Chat list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: chats.length,
              itemBuilder: (context, index) {
                final chat = chats[index];
                return GestureDetector(
                  onTap: () {
                    AppRoutes.navigateToChatDetail(context, chat);
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
                        CircleAvatar(
                          radius: 28,
                          backgroundImage: AssetImage(chat.avatarAsset),
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
                                  Text(
                                    chat.name,
                                    style: AppStyles.h3(context),
                                  ),
                                  Text(
                                    chat.time,
                                    style: AppStyles.caption(context),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  if (chat.isRead)
                                    Icon(
                                      Icons.done_all,
                                      size: 16,
                                      color: Colors.blue,
                                    ),
                                  if (chat.isRead) const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      chat.lastMessage,
                                      style: AppStyles.caption(context),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: ButtonNavBar(),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}