import 'dart:convert';
import 'package:http/http.dart' as http;

void main() async {
  final url = Uri.parse('http://localhost:3000/api/v1/properties');
  try {
    final response = await http.get(url);
    print(response.statusCode);
    print(response.body);
  } catch (e) {
    print('Error: $e');
  }
}
