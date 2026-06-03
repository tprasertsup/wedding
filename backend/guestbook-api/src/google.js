const { google } = require('googleapis');
const { config } = require('./config');

const scopes = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

let authClient;
let driveClient;
let sheetsClient;

function auth() {
  if (!authClient) {
    authClient = new google.auth.JWT({
      email: config.googleClientEmail,
      key: config.googlePrivateKey,
      scopes
    });
  }
  return authClient;
}

function drive() {
  if (!driveClient) driveClient = google.drive({ version: 'v3', auth: auth() });
  return driveClient;
}

function sheets() {
  if (!sheetsClient) sheetsClient = google.sheets({ version: 'v4', auth: auth() });
  return sheetsClient;
}

async function bearerToken() {
  const result = await auth().getAccessToken();
  return typeof result === 'string' ? result : result.token;
}

module.exports = { auth, drive, sheets, bearerToken };

