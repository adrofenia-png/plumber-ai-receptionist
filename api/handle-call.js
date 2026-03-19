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
    const speechInput = (req.body.SpeechResult || '').trim();
    const confidence = parseFloat(req.body.Confidence || 0);
    const callSid = req.body.CallSid || '';

    console.log('Speech Input:', speechInput);
    console.log('Confidence:', confidence);

    // If no speech input, it's the first call
    if (!speechInput || speechInput === '') {
      twiml.say('Hi there, thanks for calling ' + config.BUSINESS_NAME + '. I am the after hours assistant. How can I help you today?');
      twiml.gather({
        input: 'speech',
        timeout: 10,
        maxSpeechTime: 60,
        speechTimeout: 'auto',
        action: '/api/handle-call',
        hints: 'leak burst drain clogged broken water toilet sink pipe'
      });
    } else {
      // We have speech input, process it
      
      // If confidence too low, ask them to repeat
      if (confidence < 0.3) {
        twiml.say('Sorry, I did not catch that clearly. Could you say that again?');
        twiml.gather({
          input: 'speech',
          timeout: 10,
          maxSpeechTime: 60,
          speechTimeout: 'auto',
          action: '/api/handle-call',
          hints: 'leak burst drain clogged broken water toilet sink pipe'
        });
      } else {
        // Extract information
        const name = extractName(speechInput);
        const phone = extractPhone(speechInput);
        const issue = extractIssue(speechInput);
        const location = extractLocation(speechInput);

        console.log('Extracted - Name:', name, 'Phone:', phone, 'Issue:', issue, 'Location:', location);

        // If we have the essentials, save and close
        if (name && phone && issue) {
          twiml.say('Perfect. Someone from ' + config.BUSINESS_NAME + ' will call you within 2 hours. Thanks for calling.');
          
          // Save to Firebase
          try {
            await db.collection('leads').add({
              businessId: config.BUSINESS_ID,
              customerName: name,
              customerPhone: phone,
              issue: issue,
              location: location || 'Not provided',
              urgency: 'normal',
              source: 'ai_receptionist',
              createdAt: new Date()
            });
            console.log('Lead saved to Firebase');
          } catch (dbError) {
            console.error('Database error:', dbError);
          }

          // Send SMS
          try {
            await sendSMS(name, phone, issue, location);
            console.log('SMS sent');
          } catch (smsError) {
            console.error('SMS error:', smsError);
          }

          twiml.hangup();
        } else {
          // Ask for missing information
          let question = '';
          if (!name) {
            question = 'What is your name?';
          } else if (!phone) {
            question = 'What is the best phone number to reach you?';
          } else if (!issue) {
            question = 'Can you describe the problem you are having?';
          } else if (!location) {
            question = 'What is your address or location?';
          }

          twiml.say(question);
          twiml.gather({
            input: 'speech',
            timeout: 10,
            maxSpeechTime: 60,
            speechTimeout: 'auto',
            action: '/api/handle-call',
            hints: 'leak burst drain clogged broken water toilet sink pipe'
          });
        }
      }
    }

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  } catch (error) {
    console.error('Fatal Error:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Sorry, there was an error. Please try calling back shortly.');
    twiml.hangup();
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  }
};

function extractName(text) {
  const patterns = [
    /(?:I'm|I am|this is|name is|call me|my name is)\s+([A-Z][a-z]+)/i,
    /^([A-Z][a-z]+)\s+/
  ];
  for (let pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractPhone(text) {
  const match = text.match(/(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  return match ? match[1] : null;
}

function extractIssue(text) {
  const keywords = ['leak', 'broken', 'drain', 'clogged', 'burst', 'water', 'toilet', 'sink', 'pipe', 'problem', 'issue'];
  if (keywords.some(kw => text.toLowerCase().includes(kw))) {
    return text;
  }
  return null;
}

function extractLocation(text) {
  const keywords = ['street', 'address', 'avenue', 'ave', 'road', 'rd', 'drive', 'dr', 'located', 'at', 'lane'];
  if (keywords.some(kw => text.toLowerCase().includes(kw))) {
    return text;
  }
  return null;
}

async function sendSMS(name, phone, issue, location) {
  try {
    const twilio = require('twilio');
    const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    
    const message = `NEW LEAD - ${config.BUSINESS_NAME}\n\nName: ${name}\nPhone: ${phone}\nIssue: ${issue}\nLocation: ${location || 'Not provided'}\n\nCall them back ASAP!`;
    
    await client.messages.create({
      body: message,
      from: config.TWILIO_PHONE,
      to: config.OWNER_PHONE
    });
  } catch (error) {
    console.error('SMS Error:', error);
  }
}
