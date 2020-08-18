const admin = require('firebase-admin');
const lodash = require('lodash/lang');
admin.initializeApp();

const db = admin.firestore();

const TWILIO = {
  projectId: 'social-app-24c96',
  phoneNumber: '+6288977502463',
  accountSid: 'AC87ea945f52eed1569056525d44db5e8a',
  authToken: '059d19ded4d03cfa6c5c7c68cb7e4d7c'
};

module.exports = { admin, db, lodash, TWILIO };
