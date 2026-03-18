/**
 * CONFIGURATION FILE - PRODUCTION
 * 
 * This file contains all the credentials for your AI Receptionist system.
 * All values are filled in and ready to use.
 * 
 * This file should be added to your Vercel environment variables as well.
 */

module.exports = {
  // ============================================================
  // BUSINESS INFORMATION
  // ============================================================
  BUSINESS_NAME: 'Rapids Plumbing',
  BUSINESS_ID: 'plumber-001',
  OWNER_PHONE: '+256778176542',

  // ============================================================
  // TWILIO CREDENTIALS
  // ============================================================
  TWILIO_ACCOUNT_SID: 'AC1990071b27fd8855844f9a03b588a41c',
  TWILIO_AUTH_TOKEN: '19e0db400c9e5ddc018652831833f2ab',
  TWILIO_PHONE: '+12723991523',

  // ============================================================
  // FIREBASE CREDENTIALS (Service Account)
  // ============================================================
  FIREBASE_TYPE: 'service_account',
  FIREBASE_PROJECT_ID: 'plumber-ai-receptionist',
  FIREBASE_PRIVATE_KEY_ID: 'e183c8c46b332fdb4785b5fa459f2575c01fe8a9',
  FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCm4nI9izdmQ/HO\nQYfVaHZ3gu6AeyFxga0tZfCFh880FZ6FV+r3Spr1JCrlEq4tszB5gUvUghNY4V4D\nKJwMdYtRJMhJb/QOCXBpZIIRbGTIlJJMY4StCGho84UV14CBOZtybS5kuKc0OLOj\nAMR8gInCZM9ibOZpylYgxRHFWHgmotWXhy/36rl7pxcPnaVOu/7IKTMLFp3xJZjW\nL3Mmui7Nx7J8V3vyByvKdNOUSC1w0hqQACQ7zIVnLrDC82Gl8aAXqAKjJbTkdubL\nugHLfsYVbL9EYkrUGCzGclvqrBikoaSHfejPSox7+JvHJCPVBi+D5EmUP9WveGW7\nDBgPiVA5AgMBAAECggEAEUCdbSWxyKWN33P12MbvtwOMUtr9MPCmLb3Oo4ylNpi6\nO8XELuQsaIW11jBcB7HGeUvibNSKWdNpS9ahv0X9l5oVB0aGyqwIzinLqoUerCpz\n2hLQZK+sVOvr879EySyNQ0NB8GazM8UIM89Aq4WsTYeXdZuVfGqkWcdAbZBA/O6z\ncOPxMknx2wsuhGzVviqqL0tr4bbBWk5CksA55TE/64WAXubThm3J0RA3oVqv7SUu\nvYnh5C2bD+hB9UHLdc2pQmfn/yWFu4I/3b6/iuKf8QXiXkXytHS+o/ii30A+xz/i\nTMytjxsF0tDYtiSzzCOL/9YMpv9ZE+tblgCfk2KmIwKBgQDYwkBCork3Sz5Xcm5B\n8kW80RGgdLogjcd1umsABCLQk80YSZx3xgXLeRWEinXVee5moRzRVrwOmVX/qsPP\nmkrXpLAFR3pkCY31MoMS0gBKaGpgO3cSLdLqGy5zzoDXIm4xP7x4l4Zy0CXsfhlB\nhjSymM5z/knIREXDHc5YTm8OywKBgQDFGMJftKiFCtSdv45i0DA9xcjt0HG/ZxKc\nAfLp3Xh8tXHModyMB+8arEtgSNdnCmn2uPOUkBrQfIVcqCzSp3wr9BfFRT447gEx\nobsVBn+XeuM/K3e0+OOzu4vko1jKxO+S6xhMhoNlZGi8AbUlS09oX7twuR7AGBkq\n+r0bXSPYiwKBgFp2+ArXjyWcqbAleg7b5m8fcpPdI7FietSPsQiYsU8L4JU6Y6s5\nYkHBj1F52CP4d58trrFP2bzeEh5aTs7ePk4x1aTeaB5IPo8PPdUlACoN2he/ubpE\nlbpPDdwXW35uSD8VsrtBwkM4zBsfpbrLIENJsyCGCJUkqVj9n5kLYx5xAoGAG1Zd\nz2x9W0avStoA48/AgTDnt6SLwmKHgD/881cWmSWJjTp+HqYTEf4HzmkMB2y4WdI5\nZse+EGDVFo70+JrmbCpFCcWa5caNP9cQ3c+y7s3Kqz5aMi27V3iR5LqLXESIfjZB\nfovBudR9emY6O9wAPZfZpb7ndvlgtEdm51651BUCgYB7q4Yfzo1OHZzLLLrDNAWM\n3S+iMpzRXSLNlQSz+kMPnRd8PDkxNMjRbRno0VWuJ1kAXaH/gkFSd6T5r/PVZPSc\n8j3XQ8oKIpGzW9weSFa/wolnJ5Yd1Y3qBgHq5bnr2O4q0ZcQ0ZOS9KH7KINk0IWI\nZvJRqrsCCvTkHbA7/rF5jA==\n-----END PRIVATE KEY-----\n',
  FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk-fbsvc@plumber-ai-receptionist.iam.gserviceaccount.com',
  FIREBASE_CLIENT_ID: '105513907287536510294',
  FIREBASE_AUTH_URI: 'https://accounts.google.com/o/oauth2/auth',
  FIREBASE_TOKEN_URI: 'https://oauth2.googleapis.com/token',
  FIREBASE_AUTH_PROVIDER_CERT_URL: 'https://www.googleapis.com/oauth2/v1/certs',
  FIREBASE_CLIENT_CERT_URL: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40plumber-ai-receptionist.iam.gserviceaccount.com',
  FIREBASE_DATABASE_URL: 'https://plumber-ai-receptionist.firebaseio.com',

  // ============================================================
  // ELEVENLABS CREDENTIALS
  // ============================================================
  ELEVENLABS_API_KEY: 'sk_f62460a5abcf7299b6816d4620890efe2931a56aab57c08e',
  ELEVENLABS_VOICE_ID: 'riley',

  // ============================================================
  // ENVIRONMENT
  // ============================================================
  NODE_ENV: 'production',
  PORT: 3000
};
