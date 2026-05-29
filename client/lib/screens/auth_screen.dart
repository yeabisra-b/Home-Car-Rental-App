import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  _AuthScreenState createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();

  bool _isLogin = true;
  bool _isLoading = false;
  bool _obscurePassword = true;

  String _email = '';
  String _password = '';
  String _firstName = '';
  String _middleName = '';
  String _lastName = '';
  String _phoneNumber = '';
  String _role = 'TENANT'; // Default role for registration

  void _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() {
      _isLoading = true;
    });

    try {
      if (_isLogin) {
        final response = await _apiService.login(_email, _password);
        if (response.isSuccess && response.data != null) {
          _navigateToDashboard(response.data!.role);
        } else {
          _showError(response.error ?? 'Login failed');
        }
      } else {
        final response = await _apiService.register(
          email: _email,
          password: _password,
          role: _role,
          firstName: _firstName,
          middleName: _middleName,
          lastName: _lastName,
          phoneNumber: _phoneNumber,
        );
        if (response.isSuccess && response.data != null) {
          _navigateToDashboard(response.data!.role);
        } else {
          _showError(response.error ?? 'Registration failed');
        }
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _navigateToDashboard(String role) {
    if (role == 'OWNER') {
      Navigator.of(context).pushReplacementNamed('/owner-dashboard');
    } else if (role == 'TENANT') {
      Navigator.of(context).pushReplacementNamed('/tenant-dashboard');
    } else {
      _showError('Unknown role: $role');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  Widget _buildTextField({
    required String label,
    required IconData icon,
    bool obscureText = false,
    VoidCallback? onToggleObscure,
    TextInputType keyboardType = TextInputType.text,
    required FormFieldValidator<String> validator,
    required FormFieldSetter<String> onSaved,
  }) {
    return TextFormField(
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.teal),
        suffixIcon: onToggleObscure != null
            ? IconButton(
                icon: Icon(
                  obscureText ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: Colors.grey[600],
                ),
                onPressed: onToggleObscure,
                tooltip: obscureText ? 'Show password' : 'Hide password',
              )
            : null,
        filled: true,
        fillColor: Colors.grey[50],
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.teal, width: 2),
        ),
      ),
      obscureText: obscureText,
      keyboardType: keyboardType,
      validator: validator,
      onSaved: onSaved,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1E3A8A), Color(0xFF004D40)], // Deep Indigo to Deep Teal
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 48.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // App Logo / Title
                const Icon(Icons.maps_home_work, size: 80, color: Colors.white),
                const SizedBox(height: 16),
                const Text(
                  'RPMS',
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _isLogin ? 'Welcome back to your dashboard' : 'Create a new account',
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 32),
                
                // Form Card
                Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Form(
                      key: _formKey,
                      child: AnimatedSize(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              _isLogin ? 'Login' : 'Register',
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            
                            _buildTextField(
                              label: 'Email',
                              icon: Icons.email_outlined,
                              keyboardType: TextInputType.emailAddress,
                              validator: (value) {
                                if (value == null || value.isEmpty || !value.contains('@')) {
                                  return 'Please enter a valid email address';
                                }
                                return null;
                              },
                              onSaved: (value) => _email = value!,
                            ),
                            const SizedBox(height: 16),
                            
                            _buildTextField(
                              label: 'Password',
                              icon: Icons.lock_outline,
                              obscureText: _obscurePassword,
                              onToggleObscure: () =>
                                  setState(() => _obscurePassword = !_obscurePassword),
                              validator: (value) {
                                if (value == null || value.isEmpty || value.length < 6) {
                                  return 'Password must be at least 6 characters';
                                }
                                return null;
                              },
                              onSaved: (value) => _password = value!,
                            ),
                            
                            if (!_isLogin) ...[
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'First Name',
                                icon: Icons.person_outline,
                                validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                                onSaved: (value) => _firstName = value!,
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'Middle Name',
                                icon: Icons.person_outline,
                                validator: (_) => null,
                                onSaved: (value) => _middleName = value ?? '',
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'Last Name',
                                icon: Icons.person_outline,
                                validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                                onSaved: (value) => _lastName = value!,
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'Phone Number',
                                icon: Icons.phone_outlined,
                                keyboardType: TextInputType.phone,
                                validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                                onSaved: (value) => _phoneNumber = value!,
                              ),
                              const SizedBox(height: 16),
                              DropdownButtonFormField<String>(
                                initialValue: _role,
                                decoration: InputDecoration(
                                  labelText: 'Role',
                                  prefixIcon: const Icon(Icons.badge_outlined, color: Colors.teal),
                                  filled: true,
                                  fillColor: Colors.grey[50],
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide.none,
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Colors.teal, width: 2),
                                  ),
                                ),
                                items: const [
                                  DropdownMenuItem(value: 'TENANT', child: Text('Tenant')),
                                  DropdownMenuItem(value: 'OWNER', child: Text('Owner')),
                                ],
                                onChanged: (value) {
                                  setState(() {
                                    _role = value!;
                                  });
                                },
                                onSaved: (value) => _role = value!,
                              ),
                            ],
                            const SizedBox(height: 32),
                            
                            if (_isLoading)
                              const Center(child: CircularProgressIndicator())
                            else
                              ElevatedButton(
                                onPressed: _submitForm,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.teal,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 2,
                                ),
                                child: Text(
                                  _isLogin ? 'Login' : 'Register',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 16),
                            
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _isLogin = !_isLogin;
                                  _obscurePassword = true; // reset on mode switch
                                });
                              },
                              style: TextButton.styleFrom(
                                foregroundColor: Colors.teal[700],
                              ),
                              child: Text(
                                _isLogin
                                    ? 'Don\'t have an account? Register here'
                                    : 'Already have an account? Login here',
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
