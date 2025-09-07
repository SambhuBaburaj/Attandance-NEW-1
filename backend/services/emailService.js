const nodemailer = require('nodemailer');

class EmailService {
  static transporter = null;

  static async initializeTransporter() {
    if (this.transporter) return this.transporter;

    // Use environment variables for email configuration
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    };

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      await this.transporter.verify();
      console.log('📧 Email service initialized successfully');
      return this.transporter;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      // Create a mock transporter for development/testing
      this.transporter = {
        sendMail: async (options) => {
          console.log('📧 [MOCK] Email would be sent:', {
            to: options.to,
            subject: options.subject,
            preview: options.text?.substring(0, 100) + '...'
          });
          return { success: true, messageId: 'mock-' + Date.now() };
        }
      };
      return this.transporter;
    }
  }

  static async sendNotificationEmail(email, parentName, title, message, priority = 'NORMAL', sentBy = 'School System') {
    try {
      const transporter = await this.initializeTransporter();

      const priorityColor = {
        LOW: '#6B7280',
        NORMAL: '#3B82F6', 
        HIGH: '#EF4444'
      };

      const priorityLabel = {
        LOW: 'Low Priority',
        NORMAL: 'Normal',
        HIGH: '🚨 High Priority'
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 School Notification</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <div style="background: ${priorityColor[priority]}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
              ${priorityLabel[priority]}
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 15px; font-size: 20px;">${title}</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${priorityColor[priority]}; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">${message}</p>
            </div>
            
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; font-size: 14px; color: #64748b;">
              <p style="margin: 0;"><strong>Dear ${parentName},</strong></p>
              <p style="margin: 5px 0 0 0;">This notification was sent by ${sentBy} from the School Attendance Management System.</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0;">This is an automated message from the School Attendance System.</p>
              <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        School Notification - ${priorityLabel[priority]}
        
        ${title}
        
        ${message}
        
        Dear ${parentName},
        This notification was sent by ${sentBy} from the School Attendance Management System.
        
        ---
        This is an automated message from the School Attendance System.
        Please do not reply to this email.
      `;

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'School Attendance System',
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@school.com'
        },
        to: email,
        subject: `[${priorityLabel[priority]}] ${title}`,
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Priority': priority === 'HIGH' ? '1' : priority === 'LOW' ? '5' : '3',
          'X-Mailer': 'School Attendance System'
        }
      };

      const result = await transporter.sendMail(mailOptions);
      
      console.log(`📧 Email sent successfully to ${email}:`, result.messageId);
      return { 
        success: true, 
        messageId: result.messageId,
        email: email 
      };

    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        email: email 
      };
    }
  }

  static async sendBulkEmails(emailData) {
    const results = {
      sentCount: 0,
      errorCount: 0,
      errors: []
    };

    const promises = emailData.map(async (data) => {
      try {
        const result = await this.sendNotificationEmail(
          data.email,
          data.parentName,
          data.title,
          data.message,
          data.priority,
          data.sentBy
        );

        if (result.success) {
          results.sentCount++;
        } else {
          results.errorCount++;
          results.errors.push({
            email: data.email,
            error: result.error
          });
        }

        return result;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          email: data.email,
          error: error.message
        });
        return { success: false, error: error.message };
      }
    });

    await Promise.allSettled(promises);
    
    console.log(`📧 Bulk email results: ${results.sentCount} sent, ${results.errorCount} failed`);
    return results;
  }

  static async sendWelcomeEmail(email, parentName, schoolName = 'School') {
    const title = `Welcome to ${schoolName} Attendance System`;
    const message = `
      Welcome to the ${schoolName} Attendance Management System!
      
      You can now receive important notifications about your child's attendance, school events, and other updates directly through this system.
      
      Features available to you:
      • Real-time attendance notifications
      • School announcements and updates  
      • Event reminders
      • Emergency alerts
      
      If you have any questions, please contact the school administration.
    `;

    return await this.sendNotificationEmail(email, parentName, title, message, 'NORMAL', `${schoolName} Administration`);
  }

  static async testEmailService(testEmail = 'test@example.com') {
    console.log('🧪 Testing email service...');
    
    const result = await this.sendNotificationEmail(
      testEmail,
      'Test Parent',
      '🧪 Email Service Test',
      'This is a test email to verify that the email notification service is working correctly. If you receive this, the service is functioning properly!',
      'NORMAL',
      'System Administrator'
    );

    if (result.success) {
      console.log('✅ Email service test passed');
    } else {
      console.log('❌ Email service test failed:', result.error);
    }

    return result;
  }
}

module.exports = EmailService;