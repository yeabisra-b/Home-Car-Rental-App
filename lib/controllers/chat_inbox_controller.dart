import 'package:flutter/foundation.dart';
import '../models/chat_thread.dart';
import '../services/api_service.dart';

/// Manages fetching and caching of conversation threads for the inbox.
///
/// Separates threads into buying (user messaged owner about their property)
/// and selling (user is the owner and received messages about their property).
class ChatInboxController extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final String currentUserId;

  List<ChatThread> _buyingChats = [];
  List<ChatThread> _sellingChats = [];

  bool _isLoading = false;
  String? _error;

  ChatInboxController({required this.currentUserId});

  List<ChatThread> get buyingChats => _buyingChats;
  List<ChatThread> get sellingChats => _sellingChats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get totalUnreadBuying =>
      _buyingChats.where((t) => t.unread).length;

  int get totalUnreadSelling =>
      _sellingChats.where((t) => t.unread).length;

  /// Fetches all conversations for the current user, then splits them by role.
  Future<void> fetchAllChats() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _apiService.getChatThreads(currentUserId);

    if (response.isSuccess && response.data != null) {
      final all = response.data!;
      _buyingChats = all.where((t) => t.isBuying(currentUserId)).toList();
      _sellingChats = all.where((t) => t.isSelling(currentUserId)).toList();
      _error = null;
    } else {
      _error = response.error ?? 'Failed to load conversations';
    }

    _isLoading = false;
    notifyListeners();
  }
}
