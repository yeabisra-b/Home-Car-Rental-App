# Property Rentals Management System (RPMS)

A modern, cross-platform mobile and web client application built with Flutter. RPMS serves as a complete portal for property owners, tenants, and administrators to list properties, manage rental units, execute leases, handle invoices, submit maintenance requests, and chat in real-time.

The application communicates with a hosted REST API backend deployed at:  
`https://mobile-app-backend-maa0.onrender.com/api/v1`

---

## 🚀 Key Features

### 1. Authentication & Multi-Role Support
* **Multi-Role Accounts:** Users can register as an `OWNER` or `TENANT` and switch their active role seamlessly from their profile without creating separate accounts.
* **Profile Management:** Edit profile fields, change passwords, and upload profile pictures.
* **Contact Privacy Toggle:** Owners can mask their email and phone number on public property listings with a single privacy toggle (`isContactInfoVisible`).

### 2. Property & Unit Inventory
* **Dual Property Types:** Register and manage both **Buildings** (e.g. apartments) and **Vehicles** (e.g. sedans, trucks).
* **Granular Unit Management:** Add and edit specific units within a building property (specifying identifiers, rent, deposit, bedrooms, bathrooms, and custom amenities).
* **Advanced Search & Filtering:** Tenants can search and filter available units by location (city), rental price range, bedroom count, and property type.
* **Property Media:** Upload and manage property galleries (images and PDFs) with primary image designation.

### 3. Lease & Document Management
* **Lease Agreements:** Owners can draft and execute digital lease agreements with tenants.
* **Document Handling:** Upload and view signed PDF lease documents directly inside the app.
* **Lifecycle Events:** Support for mutual lease termination and formal tenant move-out notices.

### 4. Billing & Financials
* **Invoice Tracking:** View chronological lists of invoices categorized by status (`UNPAID`, `PENDING_REVIEW`, `PAID`, `OVERDUE`).
* **Payment Verification:** Tenants can upload images of payment receipts to clear invoices, which are then reviewed by property owners.

### 5. Maintenance Tickets
* **Request Pipeline:** Tenants can submit maintenance requests with detailed descriptions, priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and evidence attachments.
* **Tracking & Resolution:** Real-time progress updates through statuses from creation (`OPEN`) to resolution (`RESOLVED` or `CLOSED`).

### 6. In-App Messaging
* **Direct Chat Threads:** Secure communications channel between property owners and tenants regarding listings, leases, or maintenance.
* **Rich Interactions:** Support for messaging subjects, thread organization, and attachment files.

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
