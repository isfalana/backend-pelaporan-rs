// utils/firebase.js
const admin = require('firebase-admin');
const { cert } = require('firebase-admin/app'); // Import 'cert' secara spesifik
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: cert(serviceAccount) // Gunakan cert() langsung
});

module.exports = admin;