# 🏥 RM Docto Mobile Application

Welcome to the internal engineering repository for **RM Docto**. This application is built with **React Native** and uses **Expo Router** to deliver a dynamic, multi-role dashboard system handling everything from internal clinical administration to field agents and patient medicine deliveries.

This document serves as a comprehensive onboarding guide for developers joining the project to understand the architectural layout, core states, and feature sets.

---

## 🏗️ Architecture & Core Technologies
- **Framework:** React Native + Expo (SDK 51+)
- **Routing:** Expo Router (`app/` directory file-based routing)
- **State Management:** React Context API (Multi-provider architecture)
- **Styling:** React Native Stylesheets (with targeted Safe Area management)
- **API Client:** Axios (`services/axios.js`)
- **Navigation UI:** `@expo/vector-icons` & Custom Bottom Tabs

---

## 🗂️ Global Layout Strategy (`app/_layout.jsx`)

The entire application relies on a master root layout (`app/_layout.jsx`) that wraps the routing `Stack`. 

1. **Global Context Injection:** The root wraps the application in heavy Provider layers (`AuthProvider`, `UserProvider`, `RBACProvider`, `MedicineProvider`, `MedicineCartProvider`, `RMCreditProvider`, `AppointmentProvider`). Ensure all global state is consumed *within* these bounds.
2. **Safe Area Management:** The application strictly uses `<SafeAreaProvider>` combined with a custom `<SafeAreaView style={{ flex: 1 }} edges={['bottom']}>`. 
   * **Why?** Expo Router handles the top native headers automatically. By restricting the custom Safe Area wrapper to `edges={['bottom']}`, we avoid double-padding at the top of the app while correctly pushing our custom Tab Bars safely above modern device home-button notches.

---

## 👥 Role-Based Dashboards & Layouts

Because RM Docto serves multiple distinct user types, the `app/` structure is splintered into isolated path groups, each containing their own custom tab layouts (`(tabs)/_layout.jsx`).

### 1. `app/admin/`
**Target:** System Administrators
* **Capabilities:** View total system appointments, add patients, manage employee records, configure roles, build the medicine inventory, and track the global RM Coin ledger.
* **Layout Quirks:** Contains its own standalone stacks for `roles`, `medicine`, `employee`, and nested tabs. The Admin Tab Bar applies a unique deep purple `#6b6dbf` styling.

### 2. `app/receptionist/`
**Target:** Clinic Reception & Front Desk
* **Capabilities:** Handles daily Appointment check-ins, Face-Verification attendance tracking, global Medicine Orders dispatching, and doctor profile management.
* **Layout Quirks:** Uses identical UI components to the Admin panel for appointments, but implements strict null-safe checks during renders to prevent native UI crashes on malformed data sets that might leak from tests. Tab primary color is `#1BA6A6`.

### 3. `app/doctor/`
**Target:** Medical Practitioners
* **Capabilities:** Direct appointment queues, personal time/attendance matrices, and immediate profile syncs.

### 4. `app/agent/` & `app/marketing_agent/`
**Target:** On-field Network Promoters
* **Capabilities:** Can actively register sub-agents, view multi-tier downline networks (`my-network`), and interact heavily with the **RM Credit** pipeline and overarching Wallet architecture.

### 5. `app/rmrider/`
**Target:** Delivery Logistics
* **Capabilities:** Tracking and verifying medicine drop-offs, marking daily attendance check-ins, and routing integrations.

---

## 💊 Sub-Systems

- **Medicine Store (`app/medicine-store/`)**: A modular e-commerce stack allowing users to browse, cart, and checkout physical medicine inventories directly within the app. Features category filters and cart context management.
- **My Medicine Orders (`app/mymedicineorder/`)**: The historical tracker for end-user purchases, offering live progress details via dynamic routes (`historyDetails.jsx`).
- **RM Coins (`app/rmcoin/`)**: The proprietary internal currency ledger mapping virtual cash onto wallet UIs.

---

## 🛠️ Environment Variables & Setup

This project requires environment variables configured at build time (or within a `.env` file for local development):

```env
# Point this to the live backend OR your local IPv4 address (e.g., http://10.x.x.x:5000)
EXPO_PUBLIC_API_URL=https://api.rmdocto.in

# Mandatory for Address Tracking & Route Rendering
EXPO_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyDX...
```

### Installation
1. Install dependencies: `npm install`
2. Run standard Expo server: `npx expo start -c`
3. Generate Android APK/AAB: `eas build -p android` (Ensure `eas.json` is configured).

> **Note on Styling:** The Tab Bars dynamically stretch to adapt to device padding. Do not hardcode raw absolute pixel `height` values into any `tabBarStyle` configurations, otherwise, the navigation buttons will clip underneath physical screens.
