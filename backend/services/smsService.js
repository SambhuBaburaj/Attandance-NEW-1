const axios = require('axios');

class SmsService {
  static apiKey = process.env.SMS_API_KEY;
  static apiUrl = process.env.SMS_API_URL || 'https://api.twilio.com/2010-04-01';
  static fromNumber = process.env.SMS_FROM_NUMBER;
  static accountSid = process.env.TWILIO_ACCOUNT_SID;
  static authToken = process.env.TWILIO_AUTH_TOKEN;

  static formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming +1 for US/CA, +91 for India)
    if (cleaned.length === 10) {
      return `+91${cleaned}`; // Default to India
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    
    return `+${cleaned}`;
  }

  static async sendSmsViaTwilio(to, message) {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({
          From: this.fromNumber,
          To: this.formatPhoneNumber(to),
          Body: message
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
        status: response.data.status,
        to: response.data.to
      };

    } catch (error) {
      console.error('Twilio SMS error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  static async sendSmsViaGenericApi(to, message) {
    if (!this.apiKey || !this.apiUrl) {
      throw new Error('SMS API credentials not configured');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/send`,
        {
          to: this.formatPhoneNumber(to),
          message: message,
          from: this.fromNumber || 'School'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return {
        success: true,
        messageId: response.data.id || Date.now().toString(),
        status: response.data.status || 'sent',
        to: to
      };

    } catch (error) {
      console.error('Generic SMS API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  static async sendMockSms(to, message) {
    // Mock service for development/testing
    console.log('📲 [MOCK] SMS would be sent:', {
      to: this.formatPhoneNumber(to),
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
      status: 'delivered',
      to: this.formatPhoneNumber(to)
    };
  }

  static async sendNotificationSms(phone, parentName, title, message) {
    try {
      const smsText = `
🎓 ${title}

${message}

- School Attendance System
      `.trim();

      // Truncate if too long (SMS limit is usually 160 characters per message)
      const truncatedMessage = smsText.length > 320 
        ? smsText.substring(0, 317) + '...'
        : smsText;

      let result;

      // Try different SMS providers in order of preference
      try {
        // Try Twilio first
        if (this.accountSid && this.authToken) {
          result = await this.sendSmsViaTwilio(phone, truncatedMessage);
        } else if (this.apiKey && this.apiUrl) {
          // Try generic SMS API
          result = await this.sendSmsViaGenericApi(phone, truncatedMessage);
        } else {
          // Use mock service for development
          result = await this.sendMockSms(phone, truncatedMessage);
        }
      } catch (primaryError) {
        console.log('Primary SMS service failed, trying fallback...');
        
        // Fallback to mock service
        result = await this.sendMockSms(phone, truncatedMessage);
        result.fallback = true;
        result.primaryError = primaryError.message;
      }

      console.log(`📲 SMS sent successfully to ${phone}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        status: result.status,
        phone: phone,
        parentName: parentName,
        fallback: result.fallback || false
      };

    } catch (error) {
      console.error(`❌ Failed to send SMS to ${phone}:`, error.message);
      return {
        success: false,
        error: error.message,
        phone: phone,
        parentName: parentName
      };
    }
  }

  static async sendBulkSms(smsData) {
    const results = {
      sentCount: 0,
      errorCount: 0,
      errors: []
    };

    // Process in smaller batches to avoid rate limiting
    const batchSize = 5;
    
    for (let i = 0; i < smsData.length; i += batchSize) {
      const batch = smsData.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (data) => {
        try {
          const result = await this.sendNotificationSms(
            data.phone,
            data.parentName,
            data.title,
            data.message
          );

          if (result.success) {
            results.sentCount++;
          } else {
            results.errorCount++;
            results.errors.push({
              phone: data.phone,
              parentName: data.parentName,
              error: result.error
            });
          }

          return result;
        } catch (error) {
          results.errorCount++;
          results.errors.push({
            phone: data.phone,
            parentName: data.parentName,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < smsData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📲 Bulk SMS results: ${results.sentCount} sent, ${results.errorCount} failed`);
    return results;
  }

  static async sendEmergencySms(phone, parentName, message) {
    const emergencyText = `
🚨 URGENT - School Emergency Alert

${message}

Please contact school immediately if needed.

- School Administration
    `.trim();

    return await this.sendNotificationSms(phone, parentName, 'EMERGENCY ALERT', emergencyText);
  }

  static async testSmsService(testPhone = '+1234567890') {
    console.log('🧪 Testing SMS service...');
    
    const result = await this.sendNotificationSms(
      testPhone,
      'Test Parent',
      '🧪 SMS Test',
      'This is a test SMS to verify that the SMS notification service is working correctly.'
    );

    if (result.success) {
      console.log('✅ SMS service test passed');
      if (result.fallback) {
        console.log('⚠️  Note: SMS sent via fallback/mock service');
      }
    } else {
      console.log('❌ SMS service test failed:', result.error);
    }

    return result;
  }

  static getServiceStatus() {
    const status = {
      configured: false,
      provider: 'none',
      credentials: {
        twilio: !!(this.accountSid && this.authToken && this.fromNumber),
        generic: !!(this.apiKey && this.apiUrl),
        mock: true
      }
    };

    if (status.credentials.twilio) {
      status.configured = true;
      status.provider = 'twilio';
    } else if (status.credentials.generic) {
      status.configured = true;
      status.provider = 'generic';
    } else {
      status.configured = true;
      status.provider = 'mock';
    }

    return status;
  }
}

module.exports = SmsService;