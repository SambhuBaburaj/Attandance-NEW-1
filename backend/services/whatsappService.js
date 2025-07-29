const axios = require("axios");

class WhatsAppService {
  constructor() {
    this.isConfigured = false;
    this.accessToken = null;
    this.phoneNumberId = null;
    this.businessAccountId = null;
    this.apiVersion = "v21.0"; // Latest API version
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.initialize();
  }

  initialize() {
    try {
      this.accessToken = process.env.META_ACCESS_TOKEN;
      this.phoneNumberId = process.env.META_PHONE_NUMBER_ID;
      this.businessAccountId = process.env.META_BUSINESS_ACCOUNT_ID;
      this.appId = process.env.META_APP_ID;
      this.appSecret = process.env.META_APP_SECRET;

      if (this.accessToken && this.phoneNumberId && this.businessAccountId) {
        this.isConfigured = true;
        console.log(
          "Meta WhatsApp Business API service initialized successfully"
        );
      } else {
        console.warn(
          "Meta WhatsApp service not configured. Missing credentials in environment variables."
        );
        console.warn(
          "Required: META_ACCESS_TOKEN, META_PHONE_NUMBER_ID, META_BUSINESS_ACCOUNT_ID"
        );
      }
    } catch (error) {
      console.error("Error initializing Meta WhatsApp service:", error);
    }
  }

  formatPhoneNumber(phoneNumber) {
    console.log(`Formatting phone number: ${phoneNumber}`);
    if (!phoneNumber) return null;

    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, "");

    // Remove + if present, Meta API expects numbers without +
    cleaned = cleaned.replace(/^\+/, "");

    // If number doesn't start with country code, assume it's local (add your default country code)
    if (cleaned.length === 10) {
      cleaned = "1" + cleaned; // Assuming US numbers, adjust as needed
    }

    return cleaned;
  }

  async sendTextMessage(to, message) {
    if (!this.isConfigured) {
      throw new Error("WhatsApp service not configured");
    }

    const formattedPhone = this.formatPhoneNumber(+91 + to);
    if (!formattedPhone) {
      throw new Error("Invalid phone number format");
    }

    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        to: formattedPhone,
        status: response.data.messages[0].message_status || "sent",
      };
    } catch (error) {
      console.error(
        "Error sending WhatsApp message:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to send WhatsApp message"
      );
    }
  }

  async sendAbsentNotification(
    parentPhone,
    studentName,
    className,
    date,
    remarks = null
  ) {
    if (!this.isConfigured) {
      console.warn(
        "Meta WhatsApp service not configured. Skipping notification."
      );
      return { success: false, error: "Service not configured" };
    }

    try {
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let message = `🏫 *Attendance Alert*\n\n`;
      message += `Dear Parent,\n\n`;
      message += `Your child *${studentName}* was marked *ABSENT* today.\n\n`;
      message += `📅 Date: ${formattedDate}\n`;
      message += `🏛️ Class: ${className}\n`;

      if (remarks) {
        message += `📝 Note: ${remarks}\n`;
      }

      message += `\nIf this is incorrect, please contact the school immediately.\n\n`;
      message += `Thank you,\n`;
      message += `School Administration`;

      const result = await this.sendTextMessage(parentPhone, message);

      console.log(
        `WhatsApp notification sent successfully. Message ID: ${result.messageId}`
      );
      return result;
    } catch (error) {
      console.error("Error sending WhatsApp notification:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendBulkAbsentNotifications(absentStudents) {
    if (!this.isConfigured) {
      console.warn(
        "Meta WhatsApp service not configured. Skipping bulk notifications."
      );
      return { success: false, error: "Service not configured" };
    }

    const results = [];
    const errors = [];

    for (const student of absentStudents) {
      try {
        const result = await this.sendAbsentNotification(
          student.parentPhone,
          student.studentName,
          student.className,
          student.date,
          student.remarks
        );

        if (result.success) {
          results.push({
            studentId: student.studentId,
            studentName: student.studentName,
            messageId: result.messageId,
            sentTo: result.to,
          });
        } else {
          errors.push({
            studentId: student.studentId,
            studentName: student.studentName,
            error: result.error,
          });
        }

        // Add a delay to avoid rate limiting (Meta allows 80 messages per second)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        errors.push({
          studentId: student.studentId,
          studentName: student.studentName,
          error: error.message,
        });
      }
    }

    return {
      success: results.length > 0,
      sentCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }

  async sendCustomNotification(parentPhone, title, message, senderName, senderRole) {
    if (!this.isConfigured) {
      console.warn(
        "Meta WhatsApp service not configured. Skipping notification."
      );
      return { success: false, error: "Service not configured" };
    }

    try {
      let whatsappMessage = `📢 *${title}*\n\n`;
      whatsappMessage += `${message}\n\n`;
      whatsappMessage += `---\n`;
      whatsappMessage += `Sent by: *${senderName}* (${senderRole})\n`;
      whatsappMessage += `📅 ${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}`;

      const result = await this.sendTextMessage(parentPhone, whatsappMessage);

      console.log(
        `Custom WhatsApp notification sent successfully. Message ID: ${result.messageId}`
      );
      return result;
    } catch (error) {
      console.error("Error sending custom WhatsApp notification:", error);
      return {
        success: false,
        error:
          error.response?.data?.error?.message ||
          "Failed to send custom WhatsApp message"
      };
    }
  }

  async sendBulkCustomNotifications(notificationData) {
    if (!this.isConfigured) {
      console.warn(
        "Meta WhatsApp service not configured. Skipping bulk custom notifications."
      );
      return { success: false, error: "Service not configured" };
    }

    const results = [];
    const errors = [];

    for (const data of notificationData) {
      try {
        const result = await this.sendCustomNotification(
          data.parentPhone,
          data.title,
          data.message,
          data.senderName,
          data.senderRole
        );

        if (result.success) {
          results.push({
            parentId: data.parentId,
            parentName: data.parentName,
            messageId: result.messageId,
            sentTo: result.to,
          });
        } else {
          errors.push({
            parentId: data.parentId,
            parentName: data.parentName,
            error: result.error,
          });
        }

        // Add a delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        errors.push({
          parentId: data.parentId,
          parentName: data.parentName,
          error: error.message,
        });
      }
    }

    return {
      success: results.length > 0,
      sentCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }

  async sendTemplateMessage(to, templateName, templateParams = []) {
    if (!this.isConfigured) {
      throw new Error("WhatsApp service not configured");
    }

    const formattedPhone = this.formatPhoneNumber(to);
    if (!formattedPhone) {
      throw new Error("Invalid phone number format");
    }

    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en_US",
        },
      },
    };

    // Add parameters if provided
    if (templateParams.length > 0) {
      payload.template.components = [
        {
          type: "body",
          parameters: templateParams.map((param) => ({
            type: "text",
            text: param,
          })),
        },
      ];
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        to: formattedPhone,
        status: response.data.messages[0].message_status || "sent",
      };
    } catch (error) {
      console.error(
        "Error sending template message:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to send template message"
      );
    }
  }

  async getBusinessProfile() {
    if (!this.isConfigured) {
      throw new Error("WhatsApp service not configured");
    }

    const url = `${this.baseUrl}/${this.businessAccountId}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          fields: "id,name,verification_status",
        },
      });

      return {
        success: true,
        profile: response.data,
      };
    } catch (error) {
      console.error(
        "Error getting business profile:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.error?.message || "Failed to get business profile"
      );
    }
  }

  async getPhoneNumberInfo() {
    if (!this.isConfigured) {
      throw new Error("WhatsApp service not configured");
    }

    const url = `${this.baseUrl}/${this.phoneNumberId}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          fields: "id,display_phone_number,verified_name,quality_rating",
        },
      });

      return {
        success: true,
        phoneInfo: response.data,
      };
    } catch (error) {
      console.error(
        "Error getting phone number info:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to get phone number info"
      );
    }
  }

  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, error: "Service not configured" };
    }

    try {
      const [businessProfile, phoneInfo] = await Promise.all([
        this.getBusinessProfile(),
        this.getPhoneNumberInfo(),
      ]);

      return {
        success: true,
        businessProfile: businessProfile.profile,
        phoneInfo: phoneInfo.phoneInfo,
        apiVersion: this.apiVersion,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Webhook verification for Meta
  verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified successfully");
      return challenge;
    } else {
      console.error("Webhook verification failed");
      return null;
    }
  }

  // Handle incoming webhook messages
  handleWebhook(body) {
    try {
      if (body.object === "whatsapp_business_account") {
        body.entry.forEach((entry) => {
          entry.changes.forEach((change) => {
            if (change.field === "messages") {
              const messages = change.value.messages;
              if (messages) {
                messages.forEach((message) => {
                  console.log("Received WhatsApp message:", {
                    from: message.from,
                    id: message.id,
                    timestamp: message.timestamp,
                    type: message.type,
                  });

                  // Handle different message types here
                  if (message.type === "text") {
                    console.log("Text message:", message.text.body);
                  }
                });
              }

              // Handle status updates
              const statuses = change.value.statuses;
              if (statuses) {
                statuses.forEach((status) => {
                  console.log("Message status update:", {
                    id: status.id,
                    status: status.status,
                    timestamp: status.timestamp,
                    recipient_id: status.recipient_id,
                  });
                });
              }
            }
          });
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error handling webhook:", error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
