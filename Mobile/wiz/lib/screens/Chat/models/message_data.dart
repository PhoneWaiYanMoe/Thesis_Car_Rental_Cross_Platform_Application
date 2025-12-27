// Save as: Mobile/wiz/lib/screens/Chat/models/message_data.dart

class MessageData {
  final String text;
  final bool isSentByMe;
  final String time;
  final String date;
  final bool isRead;

  MessageData({
    required this.text,
    required this.isSentByMe,
    required this.time,
    this.date = 'Oct 3',
    this.isRead = false,
  });

  static List<MessageData> getSampleMessages(String chatName) {
    if (chatName == 'Pham Thi B') {
      return [
        MessageData(
          text: 'I accepted your rental. This is the automated message.',
          isSentByMe: false,
          time: '3:21PM',
          date: 'Oct 3',
        ),
        MessageData(
          text: 'Thank you so muchhh!',
          isSentByMe: true,
          time: '3:22PM',
          date: 'Oct 3',
          isRead: true,
        ),
        MessageData(
          text: 'Hey!',
          isSentByMe: false,
          time: '3:30PM',
          date: 'Oct 3',
        ),
        MessageData(
          text: 'For the contract, can you check now?',
          isSentByMe: false,
          time: '3:30PM',
          date: 'Oct 3',
        ),
        MessageData(
          text: 'Yes. I\'ve checked the content of the contract. I am ready to sign.',
          isSentByMe: true,
          time: '3:33PM',
          date: 'Oct 3',
          isRead: true,
        ),
      ];
    }

    // Default messages for other chats
    return [
      MessageData(
        text: 'Hello! How can I help you?',
        isSentByMe: false,
        time: '10:00 AM',
        date: 'Today',
      ),
      MessageData(
        text: 'Hi! I have a question about my booking.',
        isSentByMe: true,
        time: '10:05 AM',
        date: 'Today',
        isRead: true,
      ),
    ];
  }
}