# 📱 Build Guide for Push Notifications

## Quick Build Commands

### 📱 Preview Build (Recommended for Testing Push Notifications)
```bash
# Login to EAS (one time)
npx eas login

# Build preview APK (easiest for testing)
npx eas build --profile preview --platform android
```

### 🔧 Development Build (Advanced - for development)
```bash
# Build development APK with dev client
npx eas build --profile development --platform android
```

### 🚀 Production Build (For Play Store)
```bash
npx eas build --profile production --platform android
```

## Build Profiles Explained

- **Development**: APK with debugging enabled and development client
- **Preview**: APK for internal testing/sharing
- **Production**: App Bundle (.aab) for Google Play Store

## 📋 Build Process

1. **First Time Setup**:
   ```bash
   npm install -g @expo/cli eas-cli
   npx eas login
   ```

2. **Build**:
   ```bash
   npx eas build --profile preview --platform android
   ```

3. **Download & Install**:
   - EAS will provide a download link
   - Install the APK on your Android device
   - Push notifications will work!

## 🔔 Testing Push Notifications

Once you install the development/preview build:

1. Login as a parent
2. Click the "🔔 Test" button in Parent Dashboard
3. Or have admin send notifications from the admin panel
4. Notifications should appear even when app is closed!

## 🐛 Troubleshooting

### Build Fails?
- Make sure you're logged into EAS: `npx eas whoami`
- Check internet connection
- Try clearing cache: `npx eas build --clear-cache`

### No Push Token?
- Make sure you're using the built APK, not Expo Go
- Check device has Google Play Services
- Verify internet connection

### Notifications Not Showing?
- Check device notification settings
- Ensure app has notification permissions
- Try the test button first

## 📊 Current Status

✅ **Local notifications working** (in Expo Go)  
✅ **Push notification code ready** (for builds)  
✅ **Backend configured** (push service ready)  
⏳ **Waiting for build** (to test real push notifications)

## 🎯 Next Steps

1. Run: `npx eas build --profile preview --platform android`
2. Install the APK on your device
3. Test push notifications with the test button
4. Have admin send notifications to verify the full flow