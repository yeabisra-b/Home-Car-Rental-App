import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../main.dart';
import '../models/user.dart';
import '../models/property.dart';
import '../models/api_response.dart';
import '../models/dashboard_stats.dart';
import '../models/property_performance.dart';
import '../models/maintenance_request.dart';
import '../models/paginated_response.dart';
import '../models/rental_unit.dart';
import '../models/tenant_stats.dart';
import '../models/lease.dart';
import '../models/invoice.dart';
import '../models/message.dart';

class ApiService {
  // Configured for Android Emulator as per requirements
  static const String baseUrl = 'http://192.168.1.8:3000/api/v1';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<String?> _getToken() async {
    return await _storage.read(key: 'accessToken');
  }

  Future<void> _saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'accessToken', value: accessToken);
    await _storage.write(key: 'refreshToken', value: refreshToken);
  }

  Future<Map<String, String>> getAuthHeaders() async {
    return await _getHeaders();
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Handles the common response logic, parsing JSON and standard errors.
  ApiResponse<T> _processResponse<T>(
    http.Response response,
    T Function(dynamic) fromJsonT,
  ) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isNotEmpty) {
        final Map<String, dynamic> data = json.decode(response.body);
        return ApiResponse.fromJson(data, fromJsonT);
      }
      return ApiResponse.success(null as T); // For 204 No Content
    } else {
      try {
        final Map<String, dynamic> data = json.decode(response.body);
        return ApiResponse.fromJson(data, fromJsonT);
      } catch (_) {
        return ApiResponse.error(
          'HTTP ${response.statusCode}: ${response.reasonPhrase}',
        );
      }
    }
  }

  // --- Interceptor & Token Refresh Logic ---

  bool _isRefreshing = false;
  Completer<bool>? _refreshCompleter;

  Future<bool> _handleTokenRefresh() async {
    if (_isRefreshing) {
      return await _refreshCompleter!.future;
    }
    _isRefreshing = true;
    _refreshCompleter = Completer<bool>();

    try {
      final response = await refreshToken();
      final success = response.isSuccess && response.data == true;
      _isRefreshing = false;
      _refreshCompleter!.complete(success);
      return success;
    } catch (e) {
      _isRefreshing = false;
      _refreshCompleter!.complete(false);
      return false;
    }
  }

  void _forceLogout() {
    _storage.delete(key: 'accessToken');
    _storage.delete(key: 'refreshToken');
    navigatorKey.currentState?.pushNamedAndRemoveUntil('/auth', (route) => false);
  }

  Future<http.Response> _sendRequest(Future<http.Response> Function(Map<String, String> headers) makeRequest) async {
    var headers = await _getHeaders();
    var response = await makeRequest(headers);
    if (response.statusCode == 401) {
      bool refreshSuccess = await _handleTokenRefresh();
      if (refreshSuccess) {
        headers = await _getHeaders();
        response = await makeRequest(headers);
      } else {
        _forceLogout();
      }
    }
    return response;
  }

  Future<http.Response> _sendMultipart(Future<http.StreamedResponse> Function(Map<String, String> headers) makeRequest) async {
    var headers = await _getHeaders();
    var response = await http.Response.fromStream(await makeRequest(headers));
    if (response.statusCode == 401) {
      bool refreshSuccess = await _handleTokenRefresh();
      if (refreshSuccess) {
        headers = await _getHeaders();
        response = await http.Response.fromStream(await makeRequest(headers));
      } else {
        _forceLogout();
      }
    }
    return response;
  }

  // --- Authentication Flow ---

  /// Register a new user (Roles: OWNER, TENANT)
  Future<ApiResponse<User>> register({
    required String email,
    required String password,
    required String role,
    String? firstName,
    String? middleName,
    String? lastName,
    String? phoneNumber,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
          'role': role,
          if (firstName != null && firstName.isNotEmpty) 'firstName': firstName,
          if (middleName != null && middleName.isNotEmpty) 'middleName': middleName,
          if (lastName != null && lastName.isNotEmpty) 'lastName': lastName,
          if (phoneNumber != null && phoneNumber.isNotEmpty) 'phoneNumber': phoneNumber,
        }),
      );

      final Map<String, dynamic> responseData = json.decode(response.body);

      if (response.statusCode == 201) {
        // Save tokens if present
        if (responseData.containsKey('accessToken') &&
            responseData.containsKey('refreshToken')) {
          await _saveTokens(
            responseData['accessToken'],
            responseData['refreshToken'],
          );
        }
      }

      return _processResponse<User>(response, (json) => User.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  /// Login a user
  Future<ApiResponse<User>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      final Map<String, dynamic> responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        if (responseData.containsKey('accessToken') &&
            responseData.containsKey('refreshToken')) {
          await _saveTokens(
            responseData['accessToken'],
            responseData['refreshToken'],
          );
        }
      }

      return _processResponse<User>(response, (json) => User.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<User>> getProfile() async {
    try {
      final response = await _sendRequest((headers) => http.get(
        Uri.parse('$baseUrl/auth/profile'),
        headers: headers,
      ));
      return _processResponse<User>(response, (json) => User.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<Property>> updateProperty(String id, Map<String, dynamic> data) async {
    try {
      final response = await _sendRequest((headers) => http.put(
        Uri.parse('$baseUrl/properties/$id'),
        headers: headers,
        body: json.encode(data),
      ));
      return _processResponse<Property>(response, (json) => Property.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<RentalUnit>> getUnitById(String unitId) async {
    try {
      final response = await _sendRequest((headers) => http.get(
        Uri.parse('$baseUrl/units/$unitId'),
        headers: headers,
      ));
      return _processResponse<RentalUnit>(response, (json) => RentalUnit.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<void>> deleteProperty(String id) async {
    try {
      final response = await _sendRequest((headers) => http.delete(
        Uri.parse('$baseUrl/properties/$id'),
        headers: headers,
      ));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.success(null);
      } else {
        try {
          final data = json.decode(response.body);
          return ApiResponse.fromJson(data, (json) => null);
        } catch (_) {
          return ApiResponse.error(
            'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          );
        }
      }
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<void>> deletePropertyMedia(String mediaId) async {
    try {
      final response = await _sendRequest((headers) => http.delete(
        Uri.parse('$baseUrl/properties/media/$mediaId'),
        headers: headers,
      ));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.success(null);
      } else {
        try {
          final data = json.decode(response.body);
          return ApiResponse.fromJson(data, (json) => null);
        } catch (_) {
          return ApiResponse.error(
            'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          );
        }
      }
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<User>> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _sendRequest((headers) => http.put(
        Uri.parse('$baseUrl/auth/profile'),
        headers: headers,
        body: json.encode(data),
      ));
      return _processResponse<User>(response, (json) => User.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<void>> changePassword(String oldPassword, String newPassword) async {
    try {
      final response = await _sendRequest((headers) => http.put(
        Uri.parse('$baseUrl/auth/change-password'),
        headers: headers,
        body: json.encode({
          'oldPassword': oldPassword,
          'newPassword': newPassword,
        }),
      ));
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.success(null);
      } else {
        try {
          final data = json.decode(response.body);
          return ApiResponse.fromJson(data, (json) => null);
        } catch (_) {
          return ApiResponse.error(
            'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          );
        }
      }
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<dynamic>> uploadProfilePicture(
    String userId,
    Uint8List fileBytes,
    String filename,
  ) async {
    try {
      final uri = Uri.parse('$baseUrl/upload/user-profile/$userId');
      
      final response = await _sendMultipart((headers) async {
        final request = http.MultipartRequest('POST', uri);
        if (headers.containsKey('Authorization')) {
          request.headers['Authorization'] = headers['Authorization']!;
        }

        String extension = filename.split('.').last.toLowerCase();
        String type = 'image';
        String subtype = extension == 'png' ? 'png' : 'jpeg';

        final multipartFile = http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: filename,
          contentType: MediaType(type, subtype),
        );
        request.files.add(multipartFile);

        return await request.send();
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.success(json.decode(response.body));
      } else {
        try {
          final data = json.decode(response.body);
          return ApiResponse.fromJson(data, (json) => json);
        } catch (_) {
          return ApiResponse.error(
            'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          );
        }
      }
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  /// Refresh token
  Future<ApiResponse<bool>> refreshToken() async {
    try {
      final String? currentRefreshToken =
          await _storage.read(key: 'refreshToken');
      if (currentRefreshToken == null) {
        return ApiResponse.error('No refresh token available');
      }

      final response = await http.post(
        Uri.parse('$baseUrl/auth/refresh-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'refreshToken': currentRefreshToken,
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        if (responseData.containsKey('accessToken') &&
            responseData.containsKey('refreshToken')) {
          await _saveTokens(
            responseData['accessToken'],
            responseData['refreshToken'],
          );
          return ApiResponse.success(true);
        }
      }

      return ApiResponse.error('Failed to refresh token');
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  // --- Dashboard Data ---

  Future<ApiResponse<DashboardStats>> getOwnerStats() async {
    try {
      final response = await _sendRequest((headers) => http.get(
        Uri.parse('$baseUrl/dashboard/owner/stats'),
        headers: headers,
      ));
      return _processResponse<DashboardStats>(
        response,
        (json) => DashboardStats.fromJson(json),
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<List<PropertyPerformance>>> getPropertyPerformance() async {
    try {
      final response = await _sendRequest((headers) => http.get(
        Uri.parse('$baseUrl/reports/property-performance'),
        headers: headers,
      ));
      return _processResponse<List<PropertyPerformance>>(
        response,
        (json) {
          final List data = json['data'] ?? [];
          return data.map((e) => PropertyPerformance.fromJson(e)).toList();
        },
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<List<MaintenanceRequest>>> getUrgentMaintenanceRequests() async {
    try {
      final response = await _sendRequest((headers) => http.get(
        Uri.parse('$baseUrl/maintenance-requests?status=OPEN'),
        headers: headers,
      ));
      return _processResponse<List<MaintenanceRequest>>(
        response,
        (json) {
          final List data = json['data'] ?? [];
          final parsedList = data.map((e) => MaintenanceRequest.fromJson(e)).toList();
          return parsedList.where((req) => req.priority == 'URGENT').toList();
        },
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  // --- Property Registration ---

  Future<ApiResponse<Property>> createProperty(Map<String, dynamic> payload) async {
    try {
      final response = await _sendRequest((headers) => http.post(
        Uri.parse('$baseUrl/properties'),
        headers: headers,
        body: json.encode(payload),
      ));
      return _processResponse<Property>(
        response,
        (json) => Property.fromJson(json),
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<PaginatedResponse<Property>>> getProperties({
    int page = 1,
    int limit = 10,
    String? type,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (type != null) 'type': type,
      };
      final uri = Uri.parse('$baseUrl/properties').replace(queryParameters: queryParams);
      final response = await _sendRequest((headers) => http.get(uri, headers: headers));
      return _processResponse<PaginatedResponse<Property>>(
        response,
        (json) => PaginatedResponse.fromJson(json, (p) => Property.fromJson(p)),
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<Property>> getPropertyById(String propertyId) async {
    try {
      final response = await _sendRequest((headers) => http.get(
        Uri.parse('$baseUrl/properties/$propertyId'),
        headers: headers,
      ));
      return _processResponse<Property>(
        response,
        (json) => Property.fromJson(json),
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<RentalUnit>> addRentalUnit(String propertyId, Map<String, dynamic> payload) async {
    try {
      final response = await _sendRequest((headers) => http.post(
        Uri.parse('$baseUrl/properties/$propertyId/units'),
        headers: headers,
        body: json.encode(payload),
      ));
      return _processResponse<RentalUnit>(response, (json) => RentalUnit.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<RentalUnit>> updateRentalUnit(String unitId, Map<String, dynamic> payload) async {
    try {
      final response = await _sendRequest((headers) => http.put(
        Uri.parse('$baseUrl/units/$unitId'),
        headers: headers,
        body: json.encode(payload),
      ));
      return _processResponse<RentalUnit>(response, (json) => RentalUnit.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<void>> deleteRentalUnit(String unitId) async {
    try {
      final response = await _sendRequest((headers) => http.delete(
        Uri.parse('$baseUrl/units/$unitId'),
        headers: headers,
      ));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.success(null);
      } else {
        try {
          final data = json.decode(response.body);
          return ApiResponse.fromJson(data, (json) => null);
        } catch (_) {
          return ApiResponse.error(
            'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          );
        }
      }
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<dynamic>> uploadPropertyMedia(
    String propertyId,
    Uint8List fileBytes,
    String filename,
  ) async {
    try {
      final uri = Uri.parse('$baseUrl/upload/property-media/$propertyId');
      
      final response = await _sendMultipart((headers) async {
        final request = http.MultipartRequest('POST', uri);
        if (headers.containsKey('Authorization')) {
          request.headers['Authorization'] = headers['Authorization']!;
        }

        String extension = filename.split('.').last.toLowerCase();
        String type = 'image';
        String subtype = extension == 'png' ? 'png' : 'jpeg';

        final multipartFile = http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: filename,
          contentType: MediaType(type, subtype),
        );
        request.files.add(multipartFile);

        // Add default body fields expected by backend
        request.fields['isPrimary'] = 'true';
        request.fields['description'] = 'Property photo';

        return await request.send();
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.success(json.decode(response.body));
      } else {
        try {
          final data = json.decode(response.body);
          // Standard ApiResponse parsing
          return ApiResponse.fromJson(data, (json) => json);
        } catch (_) {
          return ApiResponse.error(
            'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          );
        }
      }
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      // Attempt to notify backend (don't wrap in _sendRequest to avoid looping on logout)
      await http.post(
        Uri.parse('$baseUrl/auth/logout'),
        headers: await _getHeaders(),
      );
    } catch (e) {
      // Log error but continue with local cleanup
      print('Logout backend notification failed: $e');
    } finally {
      // CRITICAL: Always clear local storage even if backend call fails
      await _storage.delete(key: 'accessToken');
      await _storage.delete(key: 'refreshToken');
    }
  }

  // ────────────────────── TENANT ENDPOINTS ──────────────────────

  Future<ApiResponse<TenantStats>> getTenantStats() async {
    try {
      final response = await _sendRequest((headers) => http.get(
            Uri.parse('$baseUrl/dashboard/tenant/stats'),
            headers: headers,
          ));
      return _processResponse<TenantStats>(
          response, (json) => TenantStats.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<PaginatedResponse<Lease>>> getLeases({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (status != null) 'status': status,
      };
      final uri =
          Uri.parse('$baseUrl/leases').replace(queryParameters: queryParams);
      final response =
          await _sendRequest((headers) => http.get(uri, headers: headers));
      return _processResponse<PaginatedResponse<Lease>>(
        response,
        (json) => PaginatedResponse.fromJson(json, (l) => Lease.fromJson(l)),
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<Lease>> getLeaseById(String leaseId) async {
    try {
      final response = await _sendRequest((headers) => http.get(
            Uri.parse('$baseUrl/leases/$leaseId'),
            headers: headers,
          ));
      return _processResponse<Lease>(
          response, (json) => Lease.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<PaginatedResponse<Invoice>>> getInvoices({
    String? status,
    String? leaseId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (status != null) 'status': status,
        if (leaseId != null) 'leaseId': leaseId,
      };
      final uri = Uri.parse('$baseUrl/invoices')
          .replace(queryParameters: queryParams);
      final response =
          await _sendRequest((headers) => http.get(uri, headers: headers));
      return _processResponse<PaginatedResponse<Invoice>>(
        response,
        (json) =>
            PaginatedResponse.fromJson(json, (i) => Invoice.fromJson(i)),
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<PaginatedResponse<MaintenanceRequest>>>
      getMaintenanceRequests({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (status != null) 'status': status,
      };
      final uri = Uri.parse('$baseUrl/maintenance-requests')
          .replace(queryParameters: queryParams);
      final response =
          await _sendRequest((headers) => http.get(uri, headers: headers));
      return _processResponse<PaginatedResponse<MaintenanceRequest>>(
        response,
        (json) => PaginatedResponse.fromJson(
            json, (r) => MaintenanceRequest.fromJson(r)),
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<MaintenanceRequest>> createMaintenanceRequest(
      Map<String, dynamic> data) async {
    try {
      final response = await _sendRequest((headers) => http.post(
            Uri.parse('$baseUrl/maintenance-requests'),
            headers: headers,
            body: json.encode(data),
          ));
      return _processResponse<MaintenanceRequest>(
          response, (json) => MaintenanceRequest.fromJson(json));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  // ────────────────────── MESSAGING ENDPOINTS ──────────────────────

  Future<ApiResponse<AppMessage>> sendMessage({
    required String receiverId,
    required String subject,
    required String content,
  }) async {
    try {
      final response = await _sendRequest((headers) => http.post(
            Uri.parse('$baseUrl/messages'),
            headers: headers,
            body: json.encode({
              'receiverId': receiverId,
              'subject': subject,
              'content': content,
            }),
          ));
      return _processResponse<AppMessage>(
          response, (j) => AppMessage.fromJson(j));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<List<ConversationSummary>>> getConversations(String currentUserId) async {
    try {
      final response = await _sendRequest((headers) => http.get(
            Uri.parse('$baseUrl/messages/conversations'),
            headers: headers,
          ));
      return _processResponse<List<ConversationSummary>>(
        response,
        (j) => (j['conversations'] as List<dynamic>?)
                ?.map((e) => ConversationSummary.fromJson(e, currentUserId))
                .toList() ??
            [],
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<PaginatedResponse<AppMessage>>> getMessages({
    String? otherUserId,
    int page = 1,
    int limit = 30,
  }) async {
    try {
      final Map<String, String> params = {
        'page': page.toString(),
        'limit': limit.toString(),
      };
      if (otherUserId != null) {
        params['otherUserId'] = otherUserId;
      }
      final uri = Uri.parse('$baseUrl/messages').replace(queryParameters: params);
      final response =
          await _sendRequest((headers) => http.get(uri, headers: headers));
      return _processResponse<PaginatedResponse<AppMessage>>(
        response,
        (j) => PaginatedResponse.fromJson(j, (m) => AppMessage.fromJson(m)),
      );
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<AppMessage>> markMessageRead(String messageId) async {
    try {
      final response = await _sendRequest((headers) => http.put(
            Uri.parse('$baseUrl/messages/$messageId/read'),
            headers: headers,
          ));
      return _processResponse<AppMessage>(
          response, (j) => AppMessage.fromJson(j));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }
  // ─────────────────────── LEASE MANAGEMENT ───────────────────────

  Future<ApiResponse<Lease>> createLease({
    required String unitId,
    required String tenantEmail,
    required DateTime startDate,
    required DateTime endDate,
    required num monthlyRent,
    required num depositAmount,
  }) async {
    try {
      final response = await _sendRequest((headers) => http.post(
            Uri.parse('$baseUrl/leases'),
            headers: headers,
            body: jsonEncode({
              'unitId': unitId,
              'tenantEmail': tenantEmail,
              'startDate': startDate.toIso8601String().substring(0, 10),
              'endDate': endDate.toIso8601String().substring(0, 10),
              'monthlyRent': monthlyRent,
              'depositAmount': depositAmount,
            }),
          ));
      return _processResponse<Lease>(response, (j) => Lease.fromJson(j));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<Lease>> uploadLeaseDocument({
    required String leaseId,
    required Uint8List fileBytes,
    required String fileName,
  }) async {
    try {
      final response = await _sendMultipart((headers) async {
        final request = http.MultipartRequest(
          'POST',
          Uri.parse('$baseUrl/upload/lease-document/$leaseId'),
        );
        request.headers.addAll(headers);

        request.files.add(http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: fileName,
          contentType: MediaType('application', 'pdf'),
        ));
        
        return await request.send();
      });
      
      return _processResponse<Lease>(response, (j) => Lease.fromJson(j['lease'] ?? j));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }


  Future<ApiResponse<Lease>> terminateLease({
    required String leaseId,
    required String reason,
  }) async {
    try {
      final response = await _sendRequest((headers) => http.post(
            Uri.parse('$baseUrl/leases/$leaseId/terminate'),
            headers: headers,
            body: jsonEncode({'reason': reason}),
          ));
      return _processResponse<Lease>(response, (j) => Lease.fromJson(j));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

  Future<ApiResponse<Lease>> submitMoveOutNotice({
    required String leaseId,
    required DateTime noticeDate,
    required String note,
  }) async {
    try {
      final response = await _sendRequest((headers) => http.post(
            Uri.parse('$baseUrl/leases/$leaseId/move-out-notice'),
            headers: headers,
            body: jsonEncode({
              'noticeDate': noticeDate.toIso8601String().substring(0, 10),
              'note': note,
            }),
          ));
      return _processResponse<Lease>(response, (j) => Lease.fromJson(j));
    } catch (e) {
      return ApiResponse.error('Connection error: $e');
    }
  }

}
