const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

try {
    let credential;

    // Option 1: Parse JSON string from FIREBASE_SERVICE_ACCOUNT environment variable (Best for Render / Cloud Hosts)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : process.env.FIREBASE_SERVICE_ACCOUNT;
        credential = admin.credential.cert(serviceAccount);
        console.log('[FIREBASE] Initialized via FIREBASE_SERVICE_ACCOUNT env variable.');
    }
    // Option 2: Local file fallback (firebase-service-account.json)
    else {
        const localPath = path.join(__dirname, '../../firebase-service-account.json');
        if (fs.existsSync(localPath)) {
            const serviceAccount = require(localPath);
            credential = admin.credential.cert(serviceAccount);
            console.log('[FIREBASE] Initialized via local firebase-service-account.json file.');
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            credential = admin.credential.applicationDefault();
            console.log('[FIREBASE] Initialized via GOOGLE_APPLICATION_CREDENTIALS.');
        }
    }

    if (credential) {
        admin.initializeApp({ credential });
        console.log('[FIREBASE] Firebase Admin SDK initialized successfully.');
    } else {
        console.warn('[FIREBASE] No service account key found. Push notifications will be disabled until configured.');
    }
} catch (error) {
    console.error('[FIREBASE] Firebase Admin Initialization Error:', error.message);
}

module.exports = admin;

