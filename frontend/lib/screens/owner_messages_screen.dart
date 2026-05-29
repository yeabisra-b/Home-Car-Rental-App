import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/message.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';

class OwnerMessagesScreen extends StatefulWidget {
  final String? currentUserId;

  const OwnerMessagesScreen({super.key, this.currentUserId});

  @override
  State<OwnerMessagesScreen> createState() => _OwnerMessagesScreenState();
}

class _OwnerMessagesScreenState extends State<OwnerMessagesScreen> {
  final ApiService _apiService = ApiService();
  
  List<ConversationSummary> _conversations = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchConversations();
  }

  Future<void> _fetchConversations({bool refresh = false}) async {
    if (widget.currentUserId == null) return;

    if (refresh) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    final response = await _apiService.getConversations(widget.currentUserId!);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (response.isSuccess) {
          _conversations = response.data!;
        } else {
          _error = response.error ?? 'Failed to load conversations';
        }
      });
    }
  }

  void _openChat(ConversationSummary conv) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatScreen(
          otherUser: conv.otherUser,
          currentUserId: widget.currentUserId!,
          primaryColor: Colors.indigo,
        ),
      ),
    ).then((_) => _fetchConversations(refresh: true)); // Refresh on return
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Colors.indigo));
    }

    if (_error != null && _conversations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _fetchConversations(refresh: true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
              child: const Text('Retry', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    if (_conversations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text('No conversations yet',
                style: TextStyle(color: Colors.grey[600], fontSize: 16)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: Colors.indigo,
      onRefresh: () => _fetchConversations(refresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _conversations.length,
        itemBuilder: (context, index) {
          final conv = _conversations[index];
          final isUnread = conv.unread;
          
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            elevation: isUnread ? 2 : 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                color: isUnread ? Colors.indigo.withOpacity(0.3) : Colors.grey.withOpacity(0.2),
              ),
            ),
            child: ListTile(
              onTap: () => _openChat(conv),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              leading: Stack(
                children: [
                  CircleAvatar(
                    backgroundColor: Colors.indigo[50],
                    child: Icon(Icons.person, color: Colors.indigo[300]),
                  ),
                  if (isUnread)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.indigo,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                ],
              ),
              title: Text(
                '${conv.otherUser.firstName} ${conv.otherUser.lastName}',
                style: TextStyle(
                  fontWeight: isUnread ? FontWeight.bold : FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (conv.propertyTitle.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2, bottom: 4),
                      child: Text(
                        conv.propertyTitle,
                        style: TextStyle(color: Colors.indigo[700], fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                    ),
                  Text(
                    conv.lastMessage,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: isUnread ? Colors.black87 : Colors.grey[600],
                      fontWeight: isUnread ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ],
              ),
              trailing: Text(
                DateFormat('MMM d').format(conv.time.toLocal()),
                style: TextStyle(
                  color: isUnread ? Colors.indigo : Colors.grey[500],
                  fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
                  fontSize: 12,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

