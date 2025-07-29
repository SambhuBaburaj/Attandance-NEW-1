# WhatsApp Notification Setup Guide

This guide will help you set up WhatsApp notifications for absent students using Twilio's WhatsApp API.

## Prerequisites

1. **Twilio Account**: Sign up at [https://www.twilio.com/](https://www.twilio.com/)
2. **WhatsApp Business Account**: You'll need to apply for WhatsApp Business API access through Twilio

## Step 1: Get Twilio Credentials

1. Log in to your [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** from the main dashboard
3. Copy these values for later use

## Step 2: WhatsApp Sandbox Setup (For Testing)

For development and testing, Twilio provides a WhatsApp Sandbox:

1. Go to **Messaging** > **Try it out** > **Send a WhatsApp message** in your Twilio Console
2. Follow the instructions to connect your WhatsApp number to the sandbox
3. Note the sandbox phone number (usually starts with `+1 415 523 8886`)

## Step 3: Configure Environment Variables

Update your `.env` file in the backend directory:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Replace:
- `your_account_sid_here` with your actual Twilio Account SID
- `your_auth_token_here` with your actual Twilio Auth Token
- The phone number with your Twilio WhatsApp number (for sandbox, use `+14155238886`)

## Step 4: Test the Setup

1. Start your backend server:
   ```bash
   cd backend
   npm start
   ```

2. Test the WhatsApp connection:
   ```bash
   # Using curl (replace with your JWT token)
   curl -X GET "http://localhost:5000/api/whatsapp/test" \\
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. Send a test notification:
   ```bash
   curl -X POST "http://localhost:5000/api/whatsapp/test-notification" \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
        -d '{
          "phoneNumber": "+1234567890",
          "studentName": "Test Student",
          "className": "Grade 5A"
        }'
   ```

## Step 5: Production Setup

For production use, you'll need to:

1. **Apply for WhatsApp Business API** through Twilio
2. **Get your WhatsApp Business number approved**
3. **Update the environment variables** with your production WhatsApp number
4. **Add parent phone numbers** in the correct international format

## How It Works

When attendance is marked and a student is absent:

1. The system automatically identifies absent students
2. Retrieves parent phone numbers from the database
3. Sends WhatsApp messages using the configured template
4. Logs success/failure for monitoring

## Message Template

Parents will receive a message like:

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

## Troubleshooting

### Common Issues:

1. **"Service not configured" error**
   - Check that all environment variables are set correctly
   - Restart the server after updating .env file

2. **"Invalid phone number format" error**
   - Ensure phone numbers include country code (e.g., +1234567890)
   - Remove any special characters except '+'

3. **Message delivery failed**
   - Verify the recipient's WhatsApp number is active
   - Check Twilio console for delivery logs
   - Ensure you're using the correct WhatsApp sender number

4. **Rate limiting**
   - Twilio has rate limits for WhatsApp messages
   - The system includes automatic delays between messages

### Support

- **Twilio Documentation**: [https://www.twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp)
- **Twilio Console**: [https://console.twilio.com/](https://console.twilio.com/)
- **Support**: Contact Twilio support for WhatsApp Business API issues

## Security Notes

- Keep your Twilio credentials secure and never commit them to version control
- Use environment variables for all sensitive configuration
- Monitor your Twilio usage to avoid unexpected charges
- Consider implementing message delivery confirmations for critical notifications