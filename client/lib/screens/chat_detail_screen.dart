import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/chat_thread.dart';
import '../models/message.dart';
import '../services/api_service.dart';

// ─────────────────────────────────────────────────────
//  CHAT DETAIL SCREEN
// ─────────────────────────────────────────────────────

class ChatDetailScreen extends StatefulWidget {
  final ChatThread thread;
  final String currentUserId;
  final Color primaryColor;

  const ChatDetailScreen({
    super.key,
    required this.thread,
    required this.currentUserId,
    required this.primaryColor,
  });

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final ApiService _apiService = ApiService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _messageController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  List<AppMessage> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _error;
  Timer? _refreshTimer;

  // Optimistic messages (locally added before confirmation)
  final List<AppMessage> _optimisticMessages = [];

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _fetchMessages(silent: true),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _scrollController.dispose();
    _messageController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _fetchMessages({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    final response = await _apiService.getMessages(
      conversationId: widget.thread.chatId,
      page: 1,
      limit: 100,
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (response.isSuccess) {
          // Oldest message first (reverse DESC order from API)
          _messages = response.data!.data.reversed.toList();
          _optimisticMessages.clear(); // confirmed by server
          // Mark unread messages as read
          for (final msg in _messages) {
            if (msg.readAt == null && msg.receiverId == widget.currentUserId) {
              _apiService.markMessageRead(msg.id);
            }
          }
          if (!silent) _scrollToBottom();
        } else if (!silent) {
          _error = response.error ?? 'Failed to load messages';
        }
      });
    }
  }

  void _scrollToBottom({bool animated = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        if (animated) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent + 200,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        } else {
          _scrollController.jumpTo(
            _scrollController.position.maxScrollExtent + 200,
          );
        }
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    // Optimistic update — show immediately
    final optimistic = AppMessage(
      id: 'optimistic_${DateTime.now().millisecondsSinceEpoch}',
      senderId: widget.currentUserId,
      receiverId: widget.thread.otherPartyId,
      subject: 'Chat Message',
      content: text,
      createdAt: DateTime.now(),
    );

    setState(() {
      _isSending = true;
      _optimisticMessages.add(optimistic);
      _messageController.clear();
    });
    _scrollToBottom();

    final response = await _apiService.sendMessage(
      receiverId: widget.thread.otherPartyId,
      subject: 'Chat Message',
      content: text,
      conversationId: widget.thread.chatId,
      propertyId: widget.thread.propertyId,
    );

    if (mounted) {
      if (response.isSuccess) {
        // Refresh to get confirmed messages
        await _fetchMessages(silent: true);
        _scrollToBottom();
      } else {
        // Remove optimistic on failure and restore content
        setState(() {
          _optimisticMessages.remove(optimistic);
          _messageController.text = text;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.error ?? 'Failed to send message'),
            backgroundColor: Colors.red,
          ),
        );
      }
      setState(() => _isSending = false);
    }
  }

  List<AppMessage> get _allMessages =>
      [..._messages, ..._optimisticMessages];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      appBar: _buildAppBar(),
      body: Column(
        children: [
          PropertyContextCard(
            title: widget.thread.propertyTitle,
            price: widget.thread.propertyPrice,
            propertyType: widget.thread.propertyType,
            primaryColor: widget.primaryColor,
          ),
          Expanded(child: _buildMessageList()),
          _buildInputBar(),
        ],
      ),
    );
  }

  AppBar _buildAppBar() {
    final initials = widget.thread.otherPartyName
        .split(' ')
        .where((w) => w.isNotEmpty)
        .take(2)
        .map((w) => w[0].toUpperCase())
        .join();

    return AppBar(
      backgroundColor: widget.primaryColor,
      elevation: 0,
      titleSpacing: 0,
      title: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: Colors.white24,
            child: Text(
              initials,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.thread.otherPartyName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Message List ────────────────────────────────────

  Widget _buildMessageList() {
    if (_isLoading) {
      return Center(
          child: CircularProgressIndicator(color: widget.primaryColor));
    }

    if (_error != null && _allMessages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded, size: 56, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(color: Colors.grey[500], fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchMessages,
              style: ElevatedButton.styleFrom(
                  backgroundColor: widget.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10))),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_allMessages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline_rounded,
                size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'No messages yet',
              style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 16,
                  fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 6),
            Text(
              'Send a message to start the conversation.',
              style: TextStyle(color: Colors.grey[400], fontSize: 13),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      itemCount: _allMessages.length,
      itemBuilder: (context, index) {
        final msg = _allMessages[index];
        final isMe = msg.senderId == widget.currentUserId;
        final isOptimistic = msg.id.startsWith('optimistic_');
        final showDateSeparator = _shouldShowDateSeparator(index);

        return Column(
          children: [
            if (showDateSeparator) _DateSeparator(date: msg.createdAt),
            MessageBubble(
              message: msg,
              isMe: isMe,
              primaryColor: widget.primaryColor,
              isOptimistic: isOptimistic,
            ),
          ],
        );
      },
    );
  }

  bool _shouldShowDateSeparator(int index) {
    if (index == 0) return true;
    final prev = _allMessages[index - 1];
    final curr = _allMessages[index];
    return !_isSameDay(prev.createdAt, curr.createdAt);
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  // ─── Input Bar ───────────────────────────────────────

  Widget _buildInputBar() {
    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 10,
        bottom: MediaQuery.of(context).padding.bottom + 10,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF4F6FB),
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _messageController,
                focusNode: _focusNode,
                maxLines: 5,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                decoration: const InputDecoration(
                  hintText: 'Type a message…',
                  hintStyle: TextStyle(color: Color(0xFFADB5BD)),
                  border: InputBorder.none,
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                ),
                style: const TextStyle(fontSize: 15),
              ),
            ),
          ),
          const SizedBox(width: 10),
          _SendButton(
            isSending: _isSending,
            primaryColor: widget.primaryColor,
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────
//  PROPERTY CONTEXT CARD  (sticky below app bar)
// ─────────────────────────────────────────────────────

class PropertyContextCard extends StatelessWidget {
  final String title;
  final String? price;
  final String? propertyType;
  final Color primaryColor;

  const PropertyContextCard({
    super.key,
    required this.title,
    this.price,
    this.propertyType,
    required this.primaryColor,
  });

  @override
  Widget build(BuildContext context) {
    final isVehicle = propertyType == 'VEHICLE';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            // Thumbnail
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isVehicle ? Icons.directions_car_rounded : Icons.apartment_rounded,
                color: primaryColor,
                size: 28,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF1A1A2E),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (price != null) ...[
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Icon(Icons.sell_outlined,
                            size: 12, color: primaryColor),
                        const SizedBox(width: 4),
                        Text(
                          price!,
                          style: TextStyle(
                            color: primaryColor,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isVehicle ? 'Vehicle' : 'Property',
                style: TextStyle(
                  color: primaryColor,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────
//  MESSAGE BUBBLE
// ─────────────────────────────────────────────────────

class MessageBubble extends StatelessWidget {
  final AppMessage message;
  final bool isMe;
  final Color primaryColor;
  final bool isOptimistic;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    required this.primaryColor,
    this.isOptimistic = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            _IncomingAvatar(primaryColor: primaryColor),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                _BubbleContainer(
                  isMe: isMe,
                  primaryColor: primaryColor,
                  isOptimistic: isOptimistic,
                  child: Text(
                    message.content,
                    style: TextStyle(
                      color: isMe ? Colors.white : const Color(0xFF1A1A2E),
                      fontSize: 14.5,
                      height: 1.4,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      DateFormat('h:mm a').format(message.createdAt.toLocal()),
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[500],
                      ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 4),
                      Icon(
                        isOptimistic
                            ? Icons.schedule_rounded
                            : (message.readAt != null
                                ? Icons.done_all_rounded
                                : Icons.check_rounded),
                        size: 12,
                        color: message.readAt != null
                            ? Colors.blue
                            : Colors.grey[400],
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          if (isMe) const SizedBox(width: 4),
        ],
      ),
    );
  }
}

class _BubbleContainer extends StatelessWidget {
  final bool isMe;
  final Color primaryColor;
  final bool isOptimistic;
  final Widget child;

  const _BubbleContainer({
    required this.isMe,
    required this.primaryColor,
    required this.isOptimistic,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: isOptimistic ? 0.65 : 1.0,
      duration: const Duration(milliseconds: 300),
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.72,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMe ? primaryColor : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: isMe ? const Radius.circular(18) : const Radius.circular(4),
            bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(18),
          ),
          boxShadow: [
            BoxShadow(
              color: (isMe ? primaryColor : Colors.black).withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}

class _IncomingAvatar extends StatelessWidget {
  final Color primaryColor;
  const _IncomingAvatar({required this.primaryColor});

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: 14,
      backgroundColor: primaryColor.withOpacity(0.15),
      child: Icon(Icons.person_rounded, size: 16, color: primaryColor),
    );
  }
}

// ─────────────────────────────────────────────────────
//  DATE SEPARATOR
// ─────────────────────────────────────────────────────

class _DateSeparator extends StatelessWidget {
  final DateTime date;

  const _DateSeparator({required this.date});

  String _formatDate(DateTime d) {
    final now = DateTime.now();
    if (_isSameDay(d, now)) return 'Today';
    if (_isSameDay(d, now.subtract(const Duration(days: 1)))) return 'Yesterday';
    return DateFormat('MMM d, yyyy').format(d);
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          const Expanded(child: Divider()),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              _formatDate(date.toLocal()),
              style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[500],
                  fontWeight: FontWeight.w500),
            ),
          ),
          const Expanded(child: Divider()),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────
//  SEND BUTTON  (animated)
// ─────────────────────────────────────────────────────

class _SendButton extends StatelessWidget {
  final bool isSending;
  final Color primaryColor;
  final VoidCallback onSend;

  const _SendButton({
    required this.isSending,
    required this.primaryColor,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: isSending ? primaryColor.withOpacity(0.6) : primaryColor,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: primaryColor.withOpacity(0.35),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: isSending ? null : onSend,
          child: Center(
            child: isSending
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2),
                  )
                : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
          ),
        ),
      ),
    );
  }
}
