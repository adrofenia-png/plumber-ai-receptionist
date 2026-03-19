const twilio = require('twilio');
const admin = require('firebase-admin');
const config = require('../config');

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

export default async (req, res) => {
  try {
    const twiml = new twilio.twiml.VoiceResponse();
    const speechInput = req.body.SpeechResult || '';
    const confidence = parseFloat(req.body.Confidence || 0);

    // First call - greeting
    if (!speechInput) {
      twiml.say('Hi there, thanks for calling ' + config.BUSINESS_NAME + '. I am the after hours assistant. How can I help you today?');
      twiml.gather({
        input: 'speech',
        timeout: 10,
        maxSpeechTime: 60,
        action: '/api/handle-call',
        hints: 'leak, burst, drain, clogged, broken, appointment'
      });
    } else {
      // Process response
      if (confidence < 0.5) {
        twiml.say('Sorry, I did not catch that. Could you say that again?');
        twiml.gather({
          input: 'speech',
          timeout: 10,
          maxSpeechTime: 60,
          action: '/api/handle-call',
          hints: 'leak, burst, drain, clogged, broken, appointment'
        });
      } else {
        // Extract info from what they said
        let customerName = extractName(speechInput);
        let customerPhone = extractPhone(speechInput);
        let issue = extractIssue(speechInput);
        let location = extractLocation(speechInput);

        // If we have enough info, save and close
        if (customerName && customerPhone && issue) {
          twiml.say('Perfect. Someone from ' + config.BUSINESS_NAME + ' will call you within 2 hours. Thanks for calling.');
          
          // Save to Firebase
          await db.collection('leads').add({
            businessId: config.BUSINESS_ID,
            customerName: customerName,
            customerPhone: customerPhone,
            issue: issue,
            location: location,
            urgency: 'normal',
            source: 'ai_receptionist',
            createdAt: new Date()
          });

          // Send SMS
          await sendSMS(customerName, customerPhone, issue, location);

          twiml.hangup();
        } else {
          // Ask for missing info
          if (!customerName) {
            twiml.say('What is your name?');
          } else if (!customerPhone) {
            twiml.say('What is the best number to reach you?');
          } else if (!issue) {
            twiml.say('Tell me about the problem.');
          } else {
            twiml.say('What is your address?');
          }

          twiml.gather({
            input: 'speech',
            timeout: 10,
            maxSpeechTime: 60,
            action: '/api/handle-call',
            hints: 'leak, burst, drain, clogged, broken, appointment'
          });
        }
      }
    }

    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Sorry, there was an error. Please try again later.');
    twiml.hangup();
    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml.toString());
  }
};

function extractName(text) {
  const match = text.match(/(?:I'm|this is|name is|call me)\s+([A-Z][a-z]+)/i);
  return match ? match[1] : null;
}

function extractPhone(text) {
  const match = text.match(/(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  return match ? match[1] : null;
}

function extractIssue(text) {
  const keywords = ['leak', 'broken', 'drain', 'clogged', 'burst', 'water', 'toilet', 'sink', 'pipe'];
  if (keywords.some(kw => text.toLowerCase().includes(kw))) {
    return text;
  }
  return null;
}

function extractLocation(text) {
  const keywords = ['street', 'address', 'avenue', 'road', 'drive', 'located', 'at'];
  if (keywords.some(kw => text.toLowerCase().includes(kw))) {
    return text;
  }
  return null;
}

async function sendSMS(name, phone, issue, location) {
  try {
    const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    const message = `NEW LEAD - ${config.BUSINESS_NAME}\n\nName: ${name}\nPhone: ${phone}\nIssue: ${issue}\nLocation: ${location}\n\nCall them back ASAP!`;
    
    await client.messages.create({
      body: message,
      from: config.TWILIO_PHONE,
      to: config.OWNER_PHONE
    });
  } catch (error) {
    console.error('SMS Error:', error);
  }
}
