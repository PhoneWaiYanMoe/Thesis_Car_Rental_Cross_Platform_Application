// Save as: Mobile/wiz/lib/screens/Chat/models/chat_data.dart

class ChatData {
  final String name;
  final String lastMessage;
  final String time;
  final String avatarAsset;
  final bool isRead;

  ChatData({
    required this.name,
    required this.lastMessage,
    required this.time,
    required this.avatarAsset,
    this.isRead = false,
  });

  static List<ChatData> getSampleChats() {
    return [
      ChatData(
        name: 'Nguyen Van A',
        lastMessage: 'Hello. I hope you are well, as I...',
        time: '10:50 PM',
        avatarAsset: 'assets/images/article_2.png',
        isRead: true,
      ),
      ChatData(
        name: 'Nguyen Thi A',
        lastMessage: 'I will come and pick up the ca...',
        time: '10:30 PM',
        avatarAsset: 'assets/images/article.png',
        isRead: true,
      ),
      ChatData(
        name: 'Pham Thi B',
        lastMessage: 'Thank you so muchhh!',
        time: '3:22 PM',
        avatarAsset: 'assets/images/Car.png',
        isRead: true,
      ),
    ];
  }
}