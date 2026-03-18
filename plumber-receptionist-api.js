/**
 * PLUMBER AI RECEPTIONIST - MAIN API
 * 
 * This is the main file that handles incoming calls from Twilio,
 * processes customer responses, and orchestrates everything.
 * 
 * When a customer calls your Twilio number, Twilio sends the call HERE.
 * This code decides what to say back to them.
 */

const twilio = require('twilio');
const axios = require('axios');
const admin = require('firebase-admin');

// Import your configuration (from config.js)
const config = require('./config');

// Initialize Firebase
const serviceAccount = {
  type: config.FIREBASE_TYPE,
  project_id: config.FIREBASE_PROJECT_ID,
  private_key_id: config.FIREBASE_PRIVATE_KEY_ID,
  private_key: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: config.FIREBASE_CLIENT_EMAIL,
  client_id: config.FIREBASE_CLIENT_ID,
  auth_uri: config.FIREBASE_AUTH_URI,
  token_uri: config.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: config.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: config.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

// Conversation state machine
const conversationStages = {
  GREETING: 'greeting',
  COLLECTING: 'collecting',
  CONFIRMING: 'confirming',
  CLOSING: 'closing'
};

class PlumberReceptionist {
  constructor(businessName, ownerPhone) {
    this.businessName = businessName;
    this.ownerPhone = ownerPhone;
  }

  // Initialize a new conversation
  initializeConversation() {
    return {
      stage: conversationStages.GREETING,
      customerName: null,
      customerPhone: null,
      issue: null,
      location: null,
      urgency: 'normal',
      conversationHistory: [],
      startTime: new Date()
    };
  }

  // Extract information from what the customer said
  extractInformation(message) {
    const extracted = {};

    // Extract phone number (format: XXX-XXX-XXXX or (XXX) XXX-XXXX)
    const phoneMatch = message.match(/(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
    if (phoneMatch) {
      extracted.customerPhone = phoneMatch[1];
    }

    // Extract name (pattern: "I'm John" or "This is Sarah")
    const nameMatch = message.match(/(?:I'm|this is|name is|call me)\s+([A-Z][a-z]+)/i);
    if (nameMatch) {
      extracted.customerName = nameMatch[1];
    }

    // Check if they mentioned their issue
    const issueKeywords = ['leak', 'broken', 'drain', 'clogged', 'burst', 'water', 'toilet', 'sink', 'pipe'];
    if (issueKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      extracted.issue = message; // Save their full message as the issue description
    }

    // Check if they mentioned location
    const locationKeywords = ['street', 'address', 'avenue', 'road', 'drive', 'located', 'at'];
    if (locationKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      // Try to extract address (simplified - take first sentence)
      const locationMatch = message.match(/[A-Za-z0-9\s.,#-]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)/i);
      if (locationMatch) {
        extracted.location = locationMatch[0].trim();
      }
    }

    return extracted;
  }

  // Detect urgency level from customer message
  detectUrgency(message) {
    const lowerMsg = message.toLowerCase();

    const emergencyKeywords = ['emergency', 'gas leak', 'flood', 'burst pipe', 'major leak'];
    if (emergencyKeywords.some(kw => lowerMsg.includes(kw))) {
      return 'emergency';
    }

    const urgentKeywords = ['leak', 'broken', 'not working', 'help'];
    if (urgentKeywords.some(kw => lowerMsg.includes(kw))) {
      return 'urgent';
    }

    return 'normal';
  }

  // Determine what fields are still missing
  getMissingFields(conversation) {
    const missing = [];
    if (!conversation.customerName) missing.push('name');
    if (!conversation.customerPhone) missing.push('phone');
    if (!conversation.issue) missing.push('issue');
    if (!conversation.location) missing.push('location');
    return missing;
  }

  // Generate the next response based on what we know
  generateResponse(conversation, customerMessage) {
    // Update conversation history
    conversation.conversationHistory.push({
      role: 'customer',
      message: customerMessage,
      timestamp: new Date()
    });

    // Extract any new information from their message
    const extracted = this.extractInformation(customerMessage);
    
    // Update conversation state with extracted info
    if (extracted.customerName && !conversation.customerName) {
      conversation.customerName = extracted.customerName;
    }
    if (extracted.customerPhone && !conversation.customerPhone) {
      conversation.customerPhone = extracted.customerPhone;
    }
    if (extracted.issue && !conversation.issue) {
      conversation.issue = extracted.issue;
    }
    if (extracted.location && !conversation.location) {
      conversation.location = extracted.location;
    }

    // Detect urgency
    const detectedUrgency = this.detectUrgency(customerMessage);
    if (detectedUrgency !== 'normal') {
      conversation.urgency = detectedUrgency;
    }

    // Check for emergency - escalate immediately
    if (conversation.urgency === 'emergency') {
      return {
        message: `This is an emergency. We're connecting you with someone from ${this.businessName} right now. Hang tight.`,
        nextStage: conversationStages.CLOSING,
        shouldEscalate: true
      };
    }

    // Determine what we still need
    const missingFields = this.getMissingFields(conversation);

    // If we have everything, confirm and close
    if (missingFields.length === 0) {
      const confirmMessage = `So to confirm: ${conversation.customerName}, at ${conversation.location}, dealing with ${conversation.issue}. Is that correct?`;
      return {
        message: confirmMessage,
        nextStage: conversationStages.CONFIRMING,
        shouldEscalate: false
      };
    }

    // If we're still gathering info, ask for the most important missing field
    const priority = { name: 1, phone: 2, location: 3, issue: 4 };
    const nextField = missingFields.sort((a, b) => priority[a] - priority[b])[0];

    let response = '';
    switch (nextField) {
      case 'name':
        response = `Great, I'd like to help. What's your name?`;
        break;
      case 'phone':
        response = `Thanks. What's the best number to reach you back on?`;
        break;
      case 'issue':
        response = `I understand. Can you tell me a bit more about what's happening?`;
        break;
      case 'location':
        response = `Got it. What's your address or location?`;
        break;
    }

    return {
      message: response,
      nextStage: conversationStages.COLLECTING,
      shouldEscalate: false
    };
  }

  // Check if conversation is complete
  isComplete(conversation) {
    return conversation.customerName && 
           conversation.customerPhone && 
           conversation.issue &&
           conversation.location;
  }
}

// Main handler for incoming Twilio calls
exports.handler = async (req, res) => {
  try {
    // Create Twilio response
    const twiml = new twilio.twiml.VoiceResponse();
    
    const callSid = req.body.CallSid;
    const speechInput = req.body.SpeechResult || '';
    const confidence = parseFloat(req.body.Confidence || 0);

    // If this is the first call (greeting), create new conversation
    if (!req.body.CallSid) {
      twiml.say('Hi there, thanks for calling ' + config.BUSINESS_NAME + '. I\'m the after-hours assistant. How can I help you today?');
      twiml.gather({
        input: 'speech',
        timeout: 10,
        maxSpeechTime: 60,
        speechTimeout: 'auto',
        action: `/api/handle-call`,
        hints: 'leak, burst, drain, clogged, broken, appointment'
      });
    } else {
      // Process customer response
      
      // If confidence is too low, ask them to repeat
      if (confidence < 0.5) {
        twiml.say('Sorry, I didn\'t catch that. Could you say that again?');
        twiml.gather({
          input: 'speech',
          timeout: 10,
          maxSpeechTime: 60,
          speechTimeout: 'auto',
          action: `/api/handle-call`,
          hints: 'leak, burst, drain, clogged, broken, appointment'
        });
      } else {
        // Get or create conversation from session
        let conversation = {
          callSid,
          stage: conversationStages.COLLECTING,
          customerName: null,
          customerPhone: null,
          issue: null,
          location: null,
          urgency: 'normal',
          conversationHistory: [],
          startTime: new Date()
        };

        // Initialize receptionist
        const receptionist = new PlumberReceptionist(
          config.BUSINESS_NAME,
          config.OWNER_PHONE
        );

        // Generate next response
        const response = receptionist.generateResponse(conversation, speechInput);
        
        // Speak the response
        twiml.say(response.message);

        // If conversation is complete, close it
        if (receptionist.isComplete(conversation)) {
          twiml.say(`Perfect. Someone from ${config.BUSINESS_NAME} will call you within 2 hours. Thanks for calling.`);
          
          // Save to Firebase
          await db.collection('leads').add({
            businessId: config.BUSINESS_ID,
            customerName: conversation.customerName,
            customerPhone: conversation.customerPhone,
            issue: conversation.issue,
            location: conversation.location,
            urgency: conversation.urgency,
            source: 'ai_receptionist',
            createdAt: new Date(),
            conversationHistory: conversation.conversationHistory
          });

          // Send SMS to owner
          await sendSMSToOwner(
            conversation.customerName,
            conversation.customerPhone,
            conversation.issue,
            conversation.location,
            conversation.urgency
          );

          twiml.hangup();
        } else {
          // Continue gathering info
          twiml.gather({
            input: 'speech',
            timeout: 10,
            maxSpeechTime: 60,
            speechTimeout: 'auto',
            action: `/api/handle-call`,
            hints: 'leak, burst, drain, clogged, broken, appointment'
          });
        }
      }
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in call handler:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Sorry, there was an error. Please try calling back in a moment.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

// Send SMS notification to owner
async function sendSMSToOwner(name, phone, issue, location, urgency) {
  try {
    const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    
    const urgencyEmoji = urgency === 'emergency' ? '🔴' : urgency === 'urgent' ? '🟠' : '🟡';
    
    const message = `${urgencyEmoji} NEW LEAD - ${config.BUSINESS_NAME}

Name: ${name || 'Not provided'}
Phone: ${phone || 'Not provided'}
Issue: ${issue || 'Not specified'}
Location: ${location || 'Not provided'}

👉 Call them back ASAP!`;

    await client.messages.create({
      body: message,
      from: config.TWILIO_PHONE,
      to: config.OWNER_PHONE
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

module.exports = { PlumberReceptionist };
