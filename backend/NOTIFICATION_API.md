# Custom Notification API Documentation

## Overview

The custom notification system allows administrators and teachers to send custom messages to parents through both in-app notifications and WhatsApp messages.

## Database Schema Updates

### ParentNotification Model
- Added `sentBy` field to track who sent the notification
- Added `priority` field ('HIGH', 'NORMAL', 'LOW')
- Made `studentId` optional for general notifications
- Added new notification types: 'CUSTOM', 'GENERAL'

## API Endpoints

### 1. Send Custom Notification
**POST** `/api/notifications/send`

Send custom notifications to selected parents.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Important School Notice",
  "message": "School will be closed tomorrow due to weather conditions.",
  "targetType": "ALL_PARENTS", // 'SPECIFIC', 'ALL_PARENTS', 'CLASS_PARENTS'
  "targetIds": [], // Array of parent IDs or class IDs (required for SPECIFIC and CLASS_PARENTS)
  "priority": "HIGH", // 'HIGH', 'NORMAL', 'LOW' (optional, defaults to 'NORMAL')
  "sendWhatsApp": true // Whether to send WhatsApp messages (optional, defaults to false)
}
```

**Target Types:**
- `SPECIFIC`: Send to specific parents (requires array of parent IDs in `targetIds`)
- `ALL_PARENTS`: Send to all parents in the system
- `CLASS_PARENTS`: Send to all parents who have children in specific classes (requires array of class IDs in `targetIds`)

**Response:**
```json
{
  "message": "Custom notifications sent successfully",
  "notificationsSent": 25,
  "targetType": "ALL_PARENTS",
  "notifications": [...],
  "whatsappResult": {
    "sent": 20,
    "failed": 5,
    "errors": [...]
  }
}
```

### 2. Get Notification Targets
**GET** `/api/notifications/targets`

Get available classes and parents for targeting notifications.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "classes": [
    {
      "id": "class_id",
      "name": "Mathematics",
      "grade": "10",
      "section": "A",
      "displayName": "Mathematics - Grade 10 (A)",
      "studentCount": 30
    }
  ],
  "parents": [
    {
      "id": "parent_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "whatsappOptIn": true,
      "children": [...]
    }
  ],
  "summary": {
    "totalClasses": 5,
    "totalParents": 150,
    "totalWhatsAppOptIns": 120
  }
}
```

### 3. Get Notification History
**GET** `/api/notifications/history`

Get history of sent custom notifications.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `limit`: Number of notifications to return (default: 20)
- `offset`: Number of notifications to skip (default: 0)
- `type`: Filter by notification type (optional)

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification_id",
      "title": "Important Notice",
      "message": "Message content...",
      "priority": "HIGH",
      "type": "CUSTOM",
      "sentAt": "2024-01-15T10:30:00Z",
      "sender": {
        "name": "Admin User",
        "role": "ADMIN"
      },
      "recipients": [
        {
          "parent": {...},
          "student": {...},
          "isRead": true,
          "readAt": "2024-01-15T11:00:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## Authentication & Authorization

All notification endpoints require:
- Valid JWT token in Authorization header
- User role must be 'ADMIN' or 'TEACHER'

## WhatsApp Integration

When `sendWhatsApp: true` is specified:
- Only parents who have opted in for WhatsApp notifications will receive messages
- Parents must have a valid phone number
- Messages include sender information and timestamp
- Rate limiting is applied (100ms delay between messages)

## Usage Examples

### Send to All Parents
```javascript
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'School Holiday Notice',
    message: 'School will be closed on Monday for a public holiday.',
    targetType: 'ALL_PARENTS',
    priority: 'NORMAL',
    sendWhatsApp: true
  })
});
```

### Send to Specific Class
```javascript
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Class Trip Reminder',
    message: 'Don\'t forget about the field trip tomorrow. Please ensure your child brings lunch.',
    targetType: 'CLASS_PARENTS',
    targetIds: ['class_id_1', 'class_id_2'],
    priority: 'HIGH',
    sendWhatsApp: true
  })
});
```

### Send to Specific Parents
```javascript
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Individual Parent Meeting',
    message: 'Please schedule a meeting to discuss your child\'s progress.',
    targetType: 'SPECIFIC',
    targetIds: ['parent_id_1', 'parent_id_2'],
    priority: 'HIGH',
    sendWhatsApp: false
  })
});
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (missing required fields, invalid target type)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found (no target parents found)
- `500`: Internal server error

## Database Migration

To use this feature, you need to run database migrations to update the schema:

```bash
npx prisma db push
```

This will:
- Add new fields to the ParentNotification model
- Add the relationship between User and ParentNotification for sent notifications
- Update indexes for better performance