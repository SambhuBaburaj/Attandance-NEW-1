# Attendance App Frontend

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Install Expo CLI globally (if not already installed):

```bash
npm install -g @expo/cli@latest
```

3. Start the development server:

```bash
npm start
```

## Features

- Role-based login interface (Admin, Teacher, Parent)
- React Native with Expo for cross-platform development
- Navigation with React Navigation
- Secure token-based authentication
- AsyncStorage for local data persistence

## Running the App

- Press `a` to run on Android emulator
- Press `i` to run on iOS simulator
- Press `w` to run on web browser
- Scan QR code with Expo Go app to run on physical device

## Login Roles

The app supports three different login roles:

1. **Admin**: Full access to manage teachers, parents, and classes
2. **Teacher**: Access to mark attendance for assigned classes
3. **Parent**: View attendance records for their children

Make sure to select the correct role before logging in.
