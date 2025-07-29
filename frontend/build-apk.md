# Building APK for Attendance App

## Prerequisites

1. Make sure you have Android Studio installed
2. Android SDK and build tools installed
3. Java JDK 17 or higher

## Option 1: Using EAS Build (Recommended)

### Step 1: Install EAS CLI (already done)

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Build APK

```bash
# For preview/testing APK
eas build --platform android --profile preview

# For production APK
eas build --platform android --profile production
```

## Option 2: Using Expo Prebuild + Manual Build

### Step 1: Prebuild the project

```bash
npx expo prebuild --platform android
```

### Step 2: Build APK using Gradle

```bash
cd android
./gradlew assembleRelease
```

The APK will be created at: `android/app/build/outputs/apk/release/app-release.apk`

## Option 3: Development Build

For development/testing purposes:

```bash
npx expo export --platform android
```

Then use Expo Go app to test, or create a development build:

```bash
eas build --profile development --platform android
```

## Configuration Files Created:

- `eas.json` - EAS build configuration
- `app.json` - Updated with Android package info

## Next Steps:

1. Choose one of the build options above
2. Follow the commands for your preferred method
3. The APK will be generated and can be installed on Android devices

## Note:

- For EAS builds, you'll need an Expo account (free)
- Local builds require Android development environment setup
- Preview builds are suitable for testing
- Production builds are for Play Store distribution
