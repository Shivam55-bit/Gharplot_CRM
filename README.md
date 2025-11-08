# Gharplot - Real Estate Mobile App

A comprehensive **React Native** real estate application for property listings, bookings, and services. Built with modern UI components and real-time chat functionality.

## Features

- 🏠 **Property Listings**: Browse, search, and filter properties
- 📋 **Add/Sell Properties**: List your property with detailed information
- 💬 **Real-time Chat**: Communicate with property owners and service providers
- 📅 **Appointment Booking**: Schedule property visits and services
- 🔐 **OTP Authentication**: Secure phone number verification
- 📍 **Location Services**: GPS-based property search
- 🔔 **Push Notifications**: Firebase Cloud Messaging integration
- 👤 **User Profiles**: Manage personal information and preferences
- 💾 **Saved Properties**: Bookmark favorite listings
- 🛠️ **Service Categories**: Browse various property-related services

## Tech Stack

- **Frontend**: React Native
- **Navigation**: React Navigation
- **State Management**: React Hooks
- **Authentication**: OTP-based phone verification
- **Real-time Chat**: Socket.io
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Location**: React Native Geolocation
- **UI Components**: Ionicons, LinearGradient

# Getting Started

> **Note**: Make sure you have completed the [React Native Development Environment Setup](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Prerequisites

- Node.js (>= 16)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Firebase project with FCM configured

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bhoomi-TechZone/bhoomi-99acers-shivam.git
   cd bhoomi-99acers-shivam
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **iOS Setup** (macOS only)
   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   ```

4. **Firebase Configuration**
   - Add `google-services.json` to `android/app/`
   - Add `GoogleService-Info.plist` to `ios/Gharplot/`
   - Follow the [FCM Setup Guide](FCM_SETUP_GUIDE.md)

5. **Environment Variables**
   Create a `.env` file in the root directory:
   ```
   API_BASE_URL=your_backend_api_url
   SOCKET_URL=your_socket_server_url
   ```

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

## App Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Application screens
├── navigation/         # Navigation configuration
├── services/          # API services and integrations
├── utils/             # Utility functions
├── hooks/             # Custom React hooks
├── constants/         # App constants and themes
├── assets/            # Images and static files
└── profile/           # User profile related screens
```

## Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Configuration Files

- `FCM_SETUP_GUIDE.md` - Firebase Cloud Messaging setup
- `LOCATION_SETUP_GUIDE.md` - Location services configuration
- `OTP_LOGIN_FLOW_FIXED.md` - OTP authentication implementation
- `PHONE_LOGIN_VALIDATION.md` - Phone number validation guide

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

For app-specific issues, check the documentation files:
- `crash_log.txt` - Application crash logs
- `SERVICE_FLOW_FIXES.md` - Service flow related fixes

## License

This project is licensed under the MIT License.

## Contact

For any queries or support, please contact the development team.
