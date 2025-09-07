# 📱 Notification System Setup Guide

## Current Status ✅
- ✅ **Email notifications**: Working (mock service in development)
- ✅ **SMS notifications**: Working (mock service in development) 
- ✅ **In-app notifications**: Working (stored in database)
- ⚠️ **Push notifications**: Ready but needs parent devices registered
- ⚠️ **WhatsApp notifications**: Ready but needs fresh access token

## For Production Deployment

### 1. Email Configuration
Add to your production `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-school-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Your School Name
EMAIL_FROM=your-school-email@gmail.com
```

### 2. SMS Configuration (Optional)
For Twilio SMS:
```env
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SMS_FROM_NUMBER=+1234567890
```

### 3. WhatsApp Token Update
Update the expired token in `.env`:
```env
META_ACCESS_TOKEN=your-new-meta-token
```
Get a new token from: https://developers.facebook.com/tools/explorer/

### 4. Push Notifications
**For pop-ups on phones to work:**
- Parents must install your mobile app
- App must request notification permissions
- App must register push tokens with your server

## Testing

### Test all services:
```bash
curl -X POST http://localhost:3001/api/test/notifications
```

### Send real notification:
```bash
curl -X POST http://localhost:3001/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-JWT-TOKEN" \
  -d '{
    "title": "Test Alert",
    "message": "This is a test notification",
    "targetType": "ALL_PARENTS",
    "priority": "HIGH",
    "sendWhatsApp": true
  }'
```

## What Happens When You Send a Notification

1. **In-App**: Stored in database ✅
2. **Email**: Sent to all parent email addresses ✅
3. **Push**: Pop-ups on phones (if app installed) ⚠️
4. **WhatsApp**: Messages to opted-in parents ⚠️
5. **SMS**: For HIGH priority only ✅

## Current Delivery Rate
Based on test: **33% success rate**
- Email: ✅ Working
- In-app: ✅ Working  
- Push: ⚠️ Needs parent devices
- WhatsApp: ⚠️ Needs token refresh

## Notes
- Mock services are used in development
- Real notifications require production configuration
- Push notifications need mobile app deployment
- All services have graceful fallbacks