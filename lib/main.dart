import 'package:flutter/material.dart';
import 'screens/auth_screen.dart';
import 'screens/owner_dashboard.dart';
import 'screens/tenant_dashboard.dart';
import 'screens/add_unit_screen.dart';
import 'screens/property_detail.dart';
import 'screens/unit_detail_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() {
  runApp(const RpmsApp());
}

class RpmsApp extends StatelessWidget {
  const RpmsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Rental Property Management System',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      initialRoute: '/auth',
      routes: {
        '/auth': (context) => const AuthScreen(),
        '/owner-dashboard': (context) => const OwnerDashboard(),
        '/tenant-dashboard': (context) => const TenantDashboard(),
        '/add-unit': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
          return AddUnitScreen(
            propertyId: args['propertyId'],
            propertyTitle: args['propertyTitle'],
          );
        },
        '/property-detail': (context) {
          final String propertyId = ModalRoute.of(context)!.settings.arguments as String;
          return PropertyDetailScreen(propertyId: propertyId);
        },
        '/unit-detail': (context) {
          final String unitId = ModalRoute.of(context)!.settings.arguments as String;
          return UnitDetailScreen(unitId: unitId);
        },
      },
    );
  }
}
