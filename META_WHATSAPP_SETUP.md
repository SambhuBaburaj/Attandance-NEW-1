# Meta WhatsApp Business API Setup Guide

This guide will help you set up WhatsApp notifications for absent students using Meta's WhatsApp Business API.

## Prerequisites

1. **Meta Developer Account**: Sign up at [https://developers.facebook.com/](https://developers.facebook.com/)
2. **WhatsApp Business Account**: You'll need a verified WhatsApp Business Account
3. **Facebook Business Manager**: Required for WhatsApp Business API access

## Step 1: Create a Meta App

1. Go to [Meta Developer Console](https://developers.facebook.com/)
2. Click "Create App" and select "Business" as the app type
3. Fill in your app details:
   - **App Name**: "School Attendance System" (or your preferred name)
   - **Contact Email**: Your email address
4. Once created, note down your **App ID**

## Step 2: Add WhatsApp Business API

1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set Up"
3. This will add WhatsApp Business API to your app

## Step 3: Get Your Credentials

### Access Token
1. In the WhatsApp section, go to "API Setup"
2. You'll see a temporary access token - copy this
3. For production, you'll need to generate a permanent token

### Phone Number ID
1. In the "API Setup" section, you'll see "From" dropdown
2. Select your WhatsApp Business phone number
3. Copy the **Phone Number ID** (format: 123456789012345)

### Business Account ID
1. Go to WhatsApp > Configuration
2. Find your **WhatsApp Business Account ID**
3. Copy this ID

### App Secret
1. Go to Settings > Basic in your app dashboard
2. Copy your **App Secret** (click "Show" to reveal it)

## Step 4: Configure Environment Variables

Update your `.env` file in the backend directory:

```env
# Meta WhatsApp Business API Configuration
META_ACCESS_TOKEN=your_temporary_access_token_here
META_PHONE_NUMBER_ID=your_phone_number_id_here
META_BUSINESS_ACCOUNT_ID=your_business_account_id_here
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
META_WEBHOOK_VERIFY_TOKEN=your_custom_webhook_token
```

Replace the values with your actual credentials:
- `META_ACCESS_TOKEN`: Your WhatsApp access token
- `META_PHONE_NUMBER_ID`: Your phone number ID
- `META_BUSINESS_ACCOUNT_ID`: Your business account ID
- `META_APP_ID`: Your Meta app ID
- `META_APP_SECRET`: Your Meta app secret
- `META_WEBHOOK_VERIFY_TOKEN`: A random string you create (e.g., "MySchool123Webhook")

## Step 5: Set Up Webhooks (Optional but Recommended)

Webhooks allow you to receive message delivery confirmations and replies.

### 5.1: Configure Webhook URL
1. In WhatsApp > Configuration, find "Webhook"
2. Add your webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
3. Add your verify token (same as `META_WEBHOOK_VERIFY_TOKEN`)
4. Subscribe to these webhook fields:
   - `messages` (for incoming messages)
   - `message_deliveries` (for delivery confirmations)

### 5.2: Verify Webhook
1. Click "Verify and Save"
2. Meta will send a GET request to verify your webhook
3. Your server should respond with the challenge parameter

## Step 6: Test the Setup

1. Start your backend server:
   ```bash
   cd backend
   npm start
   ```

2. Test the connection:
   ```bash
   curl -X GET "http://localhost:5000/api/whatsapp/test" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. Send a test notification:
   ```bash
   curl -X POST "http://localhost:5000/api/whatsapp/test-notification" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        -d '{
          "phoneNumber": "1234567890",
          "studentName": "Test Student",
          "className": "Grade 5A"
        }'
   ```

## Step 7: Production Setup

### 7.1: Generate Permanent Access Token
1. The temporary token expires in 24 hours
2. For production, generate a permanent token:
   - Go to WhatsApp > Getting Started
   - Follow the instructions to create a system user token
   - Grant necessary permissions: `whatsapp_business_messaging`

### 7.2: Add Phone Numbers
1. Add your WhatsApp Business phone number
2. Verify the phone number through Meta's process
3. Update parent phone numbers in your database with correct international format

### 7.3: Business Verification
1. For higher message limits, verify your business
2. Go to Business Manager > Business Settings
3. Complete business verification process

## Step 8: Message Templates (For Marketing Messages)

For certain types of messages, you need approved templates:

1. Go to WhatsApp > Message Templates
2. Create templates for:
   - Attendance alerts
   - School announcements
   - Event reminders
3. Submit for approval (takes 24-48 hours)

## How It Works

When attendance is marked and a student is absent:

1. System identifies absent students
2. Retrieves parent phone numbers from database
3. Sends WhatsApp messages via Meta Graph API
4. Logs delivery status and errors

## Message Template

Parents receive messages like:

```
🏫 *Attendance Alert*

Dear Parent,

Your child *John Doe* was marked *ABSENT* today.

📅 Date: Monday, January 15, 2024
🏛️ Class: Grade 5A (Grade 5)
📝 Note: No specific reason provided

If this is incorrect, please contact the school immediately.

Thank you,
School Administration
```

## API Endpoints

Your system now includes these endpoints:

- `GET /api/whatsapp/test` - Test connection
- `POST /api/whatsapp/test-notification` - Send test message
- `POST /api/whatsapp/send-message` - Send custom text message
- `POST /api/whatsapp/send-template` - Send template message
- `GET /api/whatsapp/business-profile` - Get business profile info
- `GET /api/whatsapp/phone-info` - Get phone number info
- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Receive webhooks

## Rate Limits

Meta has the following rate limits:
- **80 messages per second** per phone number
- **1000 conversations per day** (free tier)
- Higher limits available with business verification

## Troubleshooting

### Common Issues:

1. **"Unsupported post request" error**
   - Check your access token is valid
   - Verify phone number ID is correct
   - Ensure proper API permissions

2. **"Invalid phone number" error**
   - Use international format without '+' (e.g., 1234567890)
   - Ensure recipient has WhatsApp installed
   - Check if number is registered with WhatsApp Business

3. **"Template not found" error**
   - Only use approved message templates for marketing messages
   - For notifications, you can send freeform text messages

4. **Webhook verification failed**
   - Check webhook verify token matches environment variable
   - Ensure webhook URL is publicly accessible
   - Verify HTTPS is properly configured

5. **Message delivery failed**
   - Check if recipient number is valid
   - Verify business phone number is approved
   - Check for rate limiting

### Monitoring and Logs

1. **Message Status**: Use webhooks to track delivery status
2. **Error Logs**: Check server logs for detailed error messages
3. **Meta Analytics**: View message metrics in Meta Business Manager
4. **Rate Limiting**: Monitor API usage to avoid limits

## Security Best Practices

1. **Secure Tokens**: Never commit access tokens to version control
2. **Webhook Security**: Verify webhook signatures (implement signature verification)
3. **Environment Variables**: Use secure environment variable management
4. **HTTPS**: Always use HTTPS for webhook endpoints
5. **Access Control**: Limit API access with proper authentication

## Support and Resources

- **Meta Developer Docs**: [https://developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **WhatsApp Business API**: [https://business.whatsapp.com/api](https://business.whatsapp.com/api)
- **Meta Business Help**: [https://www.facebook.com/business/help](https://www.facebook.com/business/help)
- **API Reference**: [https://developers.facebook.com/docs/whatsapp/cloud-api/reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)

## Migration from Twilio

If you're migrating from Twilio:
1. Update environment variables as shown above
2. Test all functionality thoroughly
3. Update any hardcoded Twilio-specific logic
4. The message format and delivery should remain the same for end users

## Cost Considerations

Meta WhatsApp Business API pricing (as of 2024):
- **Free**: 1000 conversations per month
- **Paid**: $0.005-0.009 per conversation (varies by country)
- **Business Verification**: Higher free tier and better rates
- **Templates**: Additional costs for template messages

Note: A "conversation" is a 24-hour session starting with the first message.