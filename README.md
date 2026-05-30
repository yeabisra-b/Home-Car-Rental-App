# Property Rentals Management System (RPMS)

A modern, cross-platform mobile and web client application built with Flutter. RPMS serves as a portal for property owners and tenants to list properties, manage rental units, execute leases, and communicate directly.

The application communicates with a hosted REST API backend deployed at:  
`https://mobile-app-backend-maa0.onrender.com/api/v1`

---

## 🚀 Key Features

### 1. Authentication & Profile Management
* **User Accounts:** Users can sign up as an `OWNER` or `TENANT`.
* **Profile Management:** Edit profile fields (First/Middle/Last names, Phone number), change passwords, and upload profile pictures.
* **Token Auth:** Secure storage of JWT tokens for persistent sessions.

### 2. Property & Unit Inventory
* **Dual Property Types:** Register and manage both **Buildings** (e.g. apartments, houses, commercial space) and **Vehicles** (e.g. sedans, SUVs, trucks, vans, motorcycles).
* **Unit Management:** Add units within a building property (specifying identifiers, rent, deposit, bedrooms, bathrooms, and size).
* **Tenant Browse & Search:** Tenants can browse available properties and units, search, and filter by location (city) and property type.
* **Property Image Upload:** Select and upload a property image from the gallery to display on listings.

### 3. Lease Management
* **Lease Creation:** Owners can draft and create digital lease agreements for vacant units by specifying tenant details, monthly rent, security deposit, and lease dates.
* **Lease Documents:** Upload and attach PDF/image lease documents to a unit.
* **Tenant Lease Dashboard:** Tenants can view active lease details, submit move-out notices, or request lease termination.

### 4. Direct Messaging
* **Owner & Tenant Chat:** Direct, real-time message threads between property owners and tenants.
* **Inbox view:** Organized inbox listings categorized by active threads for quick access.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your system before setting up:

* **Flutter SDK** (version `>=3.2.0 <4.0.0`)
* **Dart SDK** (included with Flutter)
* An active **Emulator** (Android/iOS) or a connected **Physical Device**, or **Google Chrome** (for web builds).

---

## ⚙️ Project Setup

### Option A: Quick Setup (Recommended)
You can get the application up and running with a single script that automatically copies the template environment file, installs all dependencies, and launches the app.

#### Linux / macOS
```bash
chmod +x start.sh
./start.sh
```

#### Windows (PowerShell)
```powershell
.\start.ps1
```

---

### Option B: Manual Setup

#### 1. Environment Configuration
Copy the template `.env` file to the root of the project:
```bash
cp .env.example .env
```
Open `.env` in your editor and configure the variables:
* `API_BASE_URL`: The URL of the backend API (defaults to the hosted server).
* `APP_NAME`: Display name used in the application.
* `APP_ENV`: Deployment stage (`development`, `production`).

> [!IMPORTANT]
> If you are running the app on a **physical mobile device** or a **local Android Emulator**, you must update `API_BASE_URL` in `.env` to point to a reachable IP address (e.g. your local machine's IP, or `http://10.0.2.2:3000/api/v1` for the Android loopback interface if running a local backend).

#### 2. Get Dependencies
Run the following command at the root directory to fetch all required Flutter packages:
```bash
flutter pub get
```

#### 3. Run the Application
Start the application in development mode:

* **Default Device / Emulator:**
  ```bash
  flutter run
  ```
* **Web (Google Chrome):**
  ```bash
  flutter run -d chrome
  ```
* **Specific Device:**
  ```bash
  flutter run -d <DEVICE_ID>
  ```
  *(Run `flutter devices` to list connected target devices).*

---

## 📦 Building for Production

To compile release builds of the application for distribution:

### Android (APK or App Bundle)
```bash
flutter build apk --release
# Or to build a Google Play App Bundle:
flutter build appbundle --release
```

### iOS (Xcode required)
```bash
flutter build ipa --release
```

### Web
```bash
flutter build web --release
```

---

## 📂 Project Structure

```lic
├── android/                  # Android-specific configuration and Gradle files
├── ios/                      # iOS-specific build configs and Xcode project
├── lib/                      # Core Flutter source code
│   ├── config/               # App environment and dotenv loaders
│   ├── controllers/          # State and UI controller business logic
│   ├── models/               # Data models representing API entities (User, Property, etc.)
│   ├── screens/              # UI screens (auth, dashboards, messaging, forms)
│   ├── services/             # API client services (network requests, storage)
│   ├── widgets/              # Reusable UI component widgets
│   └── main.dart             # Application entry point & router
├── assets/                   # Static app assets (e.g., icons, images)
├── test/                     # Unit and Widget tests
├── .env.example              # Template environment variables configuration
├── api_doc.md                # Comprehensive backend API endpoints documentation
├── pubspec.yaml              # Package dependencies and Flutter settings
├── start.sh                  # Linux/macOS startup helper script
└── start.ps1                 # Windows PowerShell startup helper script
```
