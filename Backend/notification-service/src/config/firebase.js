const admin = require("firebase-admin");

// initialize Firebase Admin SDK only if credentials are provided
let firebaseApp = null;

const initializeFirebase = () => {
  try {
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("Firebase initialized for push notifications");
    } else {
      console.log("Firebase not configured (push notifications disabled)");
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error.message);
  }
};

const getMessaging = () => {
  if (!firebaseApp) {
    throw new Error("Firebase not initialized");
  }
  return admin.messaging();
};

module.exports = {
  initializeFirebase,
  getMessaging,
  isFirebaseEnabled: () => firebaseApp !== null,
};
