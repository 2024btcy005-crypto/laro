const admin = require('firebase-admin');

// Ensure to set GOOGLE_APPLICATION_CREDENTIALS in your environment variables
// pointing to your downloaded firebase service account json file
// e.g. GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-adminsdk.json"

try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        console.log("Firebase Admin Initialized successfully.");
    } else {
        console.warn("GOOGLE_APPLICATION_CREDENTIALS not found. Firebase will not work.");
    }
} catch (error) {
    console.error("Firebase Admin Initialization Error", error);
}

module.exports = admin;
