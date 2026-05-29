import 'package:flutter/material.dart';

class SettingsScreen extends StatefulWidget {
  final Color themeColor;
  const SettingsScreen({super.key, this.themeColor = Colors.indigo});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  // Mock settings state
  bool _pushNotifications = true;
  bool _emailUpdates = true;
  bool _smsAlerts = false;
  bool _darkMode = false;

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 24, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          color: widget.themeColor,
          fontWeight: FontWeight.bold,
          fontSize: 13,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey[700]),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeThumbColor: widget.themeColor,
      ),
    );
  }

  Widget _buildNavigationTile({
    required String title,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey[700]),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: widget.themeColor,
        elevation: 0,
      ),
      body: ListView(
        children: [
          _buildSectionHeader('Notifications'),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Column(
              children: [
                _buildSwitchTile(
                  title: 'Push Notifications',
                  icon: Icons.notifications_active_outlined,
                  value: _pushNotifications,
                  onChanged: (val) => setState(() => _pushNotifications = val),
                ),
                const Divider(height: 1),
                _buildSwitchTile(
                  title: 'Email Updates',
                  icon: Icons.email_outlined,
                  value: _emailUpdates,
                  onChanged: (val) => setState(() => _emailUpdates = val),
                ),
                const Divider(height: 1),
                _buildSwitchTile(
                  title: 'SMS Alerts',
                  icon: Icons.sms_outlined,
                  value: _smsAlerts,
                  onChanged: (val) => setState(() => _smsAlerts = val),
                ),
              ],
            ),
          ),
          _buildSectionHeader('Appearance'),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: _buildSwitchTile(
              title: 'Dark Mode',
              icon: Icons.dark_mode_outlined,
              value: _darkMode,
              onChanged: (val) => setState(() => _darkMode = val),
            ),
          ),
          _buildSectionHeader('Support & Legal'),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Column(
              children: [
                _buildNavigationTile(
                  title: 'Help Center & FAQ',
                  icon: Icons.help_outline,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Help Center coming soon')),
                    );
                  },
                ),
                const Divider(height: 1),
                _buildNavigationTile(
                  title: 'Terms of Service',
                  icon: Icons.description_outlined,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Terms of Service coming soon')),
                    );
                  },
                ),
                const Divider(height: 1),
                _buildNavigationTile(
                  title: 'Privacy Policy',
                  icon: Icons.privacy_tip_outlined,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Privacy Policy coming soon')),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          Center(
            child: Text(
              'RPMS v1.0.0',
              style: TextStyle(
                color: Colors.grey[500],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
