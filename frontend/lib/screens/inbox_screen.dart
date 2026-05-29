import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../controllers/chat_inbox_controller.dart';
import '../models/chat_thread.dart';
import 'chat_detail_screen.dart';

// ─────────────────────────────────────────────────────
//  INBOX SCREEN  (Buying / Selling tabs)
// ─────────────────────────────────────────────────────

class InboxScreen extends StatefulWidget {
  final String? currentUserId;
  final Color primaryColor;
  final bool isSeller;

  const InboxScreen({
    super.key,
    this.currentUserId,
    this.primaryColor = Colors.indigo,
    required this.isSeller,
  });

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  late ChatInboxController _controller;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _initController();
  }

  void _initController() {
    if (widget.currentUserId == null) return;
    _controller = ChatInboxController(currentUserId: widget.currentUserId!);
    _controller.addListener(_onControllerUpdate);
    _controller.fetchAllChats();
    // Poll for new messages every 15 s
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => _controller.fetchAllChats(),
    );
  }

  void _onControllerUpdate() {
    if (mounted) setState(() {});
  }

  void _cleanupController(String? oldUserId) {
    _refreshTimer?.cancel();
    _refreshTimer = null;
    if (oldUserId != null) {
      _controller.removeListener(_onControllerUpdate);
      _controller.dispose();
    }
  }

  @override
  void didUpdateWidget(covariant InboxScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentUserId != oldWidget.currentUserId) {
      _cleanupController(oldWidget.currentUserId);
      _initController();
    }
  }

  @override
  void dispose() {
    _cleanupController(widget.currentUserId);
    super.dispose();
  }

  void _openChat(ChatThread thread) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChatDetailScreen(
          thread: thread,
          currentUserId: widget.currentUserId!,
          primaryColor: widget.primaryColor,
        ),
      ),
    ).then((_) => _controller.fetchAllChats());
  }

  @override
  Widget build(BuildContext context) {
    if (widget.currentUserId == null) {
      return const _EmptyInboxPlaceholder(
        icon: Icons.lock_outline,
        headline: 'Not logged in',
        subtext: 'Please log in to view your messages.',
      );
    }

    return widget.isSeller
        ? _buildThreadList(
            threads: _controller.sellingChats,
            emptyIcon: Icons.business_outlined,
            emptyHeadline: 'No messages yet',
            emptySubtext:
                'When tenants reach out about your properties, conversations will appear here.',
          )
        : _buildThreadList(
            threads: _controller.buyingChats,
            emptyIcon: Icons.search_outlined,
            emptyHeadline: 'No messages yet',
            emptySubtext:
                'When you contact a property owner, your conversations will appear here.',
          );
  }

  // ─── Thread List ─────────────────────────────────────

  Widget _buildThreadList({
    required List<ChatThread> threads,
    required IconData emptyIcon,
    required String emptyHeadline,
    required String emptySubtext,
  }) {
    if (_controller.isLoading && threads.isEmpty) {
      return Center(
        child: CircularProgressIndicator(color: widget.primaryColor),
      );
    }

    if (_controller.error != null && threads.isEmpty) {
      return _buildErrorState(_controller.error!);
    }

    if (threads.isEmpty) {
      return _EmptyInboxPlaceholder(
        icon: emptyIcon,
        headline: emptyHeadline,
        subtext: emptySubtext,
        primaryColor: widget.primaryColor,
      );
    }

    return RefreshIndicator(
      color: widget.primaryColor,
      onRefresh: _controller.fetchAllChats,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
        itemCount: threads.length,
        itemBuilder: (context, index) => _ChatThreadTile(
          thread: threads[index],
          primaryColor: widget.primaryColor,
          onTap: () => _openChat(threads[index]),
        ),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'Could not load messages',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[500], fontSize: 13),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _controller.fetchAllChats,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────
//  CHAT THREAD TILE
// ─────────────────────────────────────────────────────

class _ChatThreadTile extends StatelessWidget {
  final ChatThread thread;
  final Color primaryColor;
  final VoidCallback onTap;

  const _ChatThreadTile({
    required this.thread,
    required this.primaryColor,
    required this.onTap,
  });

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inDays == 0) return DateFormat('h:mm a').format(time);
    if (diff.inDays < 7) return DateFormat('EEE').format(time);
    return DateFormat('MMM d').format(time);
  }

  @override
  Widget build(BuildContext context) {
    final isUnread = thread.unread;
    final initials = thread.otherPartyName.isNotEmpty
        ? thread.otherPartyName
            .split(' ')
            .where((w) => w.isNotEmpty)
            .take(2)
            .map((w) => w[0].toUpperCase())
            .join()
        : '?';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: isUnread
                ? primaryColor.withOpacity(0.04)
                : Colors.transparent,
            border: Border(
              bottom: BorderSide(color: Colors.grey.shade200, width: 1),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar
              Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: primaryColor.withOpacity(0.15),
                    child: Text(
                      initials,
                      style: TextStyle(
                        color: primaryColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  if (isUnread)
                    Positioned(
                      right: -2,
                      top: -2,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.redAccent,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 14),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            thread.otherPartyName,
                            style: TextStyle(
                              fontWeight: isUnread
                                  ? FontWeight.bold
                                  : FontWeight.w600,
                              fontSize: 15,
                              color: Colors.grey[900],
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatTime(thread.time),
                          style: TextStyle(
                            fontSize: 12,
                            color: isUnread ? primaryColor : Colors.grey[500],
                            fontWeight: isUnread
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    // Property pill
                    if (thread.propertyTitle.isNotEmpty) ...[
                      _PropertyPill(
                        title: thread.propertyTitle,
                        price: thread.propertyPrice,
                        primaryColor: primaryColor,
                      ),
                      const SizedBox(height: 4),
                    ],
                    // Last message
                    Text(
                      thread.lastMessage,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        color: isUnread ? Colors.grey[800] : Colors.grey[500],
                        fontWeight: isUnread
                            ? FontWeight.w500
                            : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              if (isUnread) ...[
                const SizedBox(width: 8),
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 6),
                  decoration: BoxDecoration(
                    color: primaryColor,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────
//  PROPERTY PILL (inline within tile)
// ─────────────────────────────────────────────────────

class _PropertyPill extends StatelessWidget {
  final String title;
  final String? price;
  final Color primaryColor;

  const _PropertyPill({
    required this.title,
    this.price,
    required this.primaryColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: primaryColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.home_outlined, size: 11, color: primaryColor),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              price != null ? '$title · $price' : title,
              style: TextStyle(
                color: primaryColor,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────
//  EMPTY INBOX PLACEHOLDER
// ─────────────────────────────────────────────────────

class _EmptyInboxPlaceholder extends StatefulWidget {
  final IconData icon;
  final String headline;
  final String subtext;
  final Color? primaryColor;

  const _EmptyInboxPlaceholder({
    required this.icon,
    required this.headline,
    required this.subtext,
    this.primaryColor,
  });

  @override
  State<_EmptyInboxPlaceholder> createState() =>
      _EmptyInboxPlaceholderState();
}

class _EmptyInboxPlaceholderState
    extends State<_EmptyInboxPlaceholder>
    with SingleTickerProviderStateMixin {
  late final AnimationController _anim;
  late final Animation<double> _scaleAnim;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _scaleAnim = CurvedAnimation(parent: _anim, curve: Curves.elasticOut);
    _fadeAnim = CurvedAnimation(parent: _anim, curve: Curves.easeIn);
    _anim.forward();
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.primaryColor ?? Colors.grey;
    return FadeTransition(
      opacity: _fadeAnim,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ScaleTransition(
                scale: _scaleAnim,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(widget.icon, size: 48, color: color.withOpacity(0.5)),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                widget.headline,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                widget.subtext,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
