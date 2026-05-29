import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static const String _defaultApiBaseUrl = 'http://localhost:3000/api/v1';

  static Future<void> load() async {
    await dotenv.load(fileName: '.env', isOptional: true);
  }

  static String get apiBaseUrl {
    final configured = dotenv.maybeGet('API_BASE_URL')?.trim();
    final selected = (configured == null || configured.isEmpty)
        ? _defaultApiBaseUrl
        : configured;

    return selected.endsWith('/')
        ? selected.substring(0, selected.length - 1)
        : selected;
  }
}
