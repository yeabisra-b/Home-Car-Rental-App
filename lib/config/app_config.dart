import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static const String _defaultApiBaseUrl = 'http://localhost:3000/api/v1';

  static Future<void> load() async {
    await dotenv.load(fileName: '.env', isOptional: true);
  }

  static String get apiBaseUrl =>
      dotenv.maybeGet('API_BASE_URL', fallback: _defaultApiBaseUrl)?.trim() ??
      _defaultApiBaseUrl;
}
