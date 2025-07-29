const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const { authenticateToken } = require('../middleware/auth');

// Test Meta WhatsApp connection
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const result = await whatsappService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing Meta WhatsApp connection:', error);
    res.status(500).json({ error: 'Failed to test Meta WhatsApp connection' });
  }
});

// Send test notification
router.post('/test-notification', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, studentName, className } = req.body;
    
    if (!phoneNumber || !studentName || !className) {
      return res.status(400).json({ 
        error: 'Phone number, student name, and class name are required' 
      });
    }

    const result = await whatsappService.sendAbsentNotification(
      phoneNumber,
      studentName,
      className,
      new Date(),
      'This is a test message from the attendance system'
    );

    res.json(result);
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Send custom text message
router.post('/send-message', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        error: 'Phone number and message are required' 
      });
    }

    const result = await whatsappService.sendTextMessage(phoneNumber, message);
    res.json(result);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send template message
router.post('/send-template', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, templateName, templateParams = [] } = req.body;
    
    if (!phoneNumber || !templateName) {
      return res.status(400).json({ 
        error: 'Phone number and template name are required' 
      });
    }

    const result = await whatsappService.sendTemplateMessage(phoneNumber, templateName, templateParams);
    res.json(result);
  } catch (error) {
    console.error('Error sending template message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get business profile info
router.get('/business-profile', authenticateToken, async (req, res) => {
  try {
    const result = await whatsappService.getBusinessProfile();
    res.json(result);
  } catch (error) {
    console.error('Error getting business profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get phone number info
router.get('/phone-info', authenticateToken, async (req, res) => {
  try {
    const result = await whatsappService.getPhoneNumberInfo();
    res.json(result);
  } catch (error) {
    console.error('Error getting phone info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook verification endpoint (Meta requires this for webhook setup)
router.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verificationResult = whatsappService.verifyWebhook(mode, token, challenge);
    
    if (verificationResult) {
      console.log('Webhook verified successfully');
      res.status(200).send(verificationResult);
    } else {
      console.error('Webhook verification failed');
      res.status(403).send('Forbidden');
    }
  } catch (error) {
    console.error('Error in webhook verification:', error);
    res.status(500).json({ error: 'Webhook verification failed' });
  }
});

// Webhook endpoint to receive messages and status updates
router.post('/webhook', (req, res) => {
  try {
    const body = req.body;
    
    console.log('Received webhook:', JSON.stringify(body, null, 2));
    
    const result = whatsappService.handleWebhook(body);
    
    if (result.success) {
      res.status(200).send('OK');
    } else {
      console.error('Error handling webhook:', result.error);
      res.status(500).send('Error processing webhook');
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
    res.status(500).send('Error processing webhook');
  }
});

module.exports = router;