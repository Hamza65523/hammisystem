const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK with your service account credentials
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Replace with your own
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Function to send push notification
const sendPushNotification = async (deviceToken, message) => {
  try {
    const response = await admin.messaging().sendToDevice(deviceToken, {
      notification: {
        title: 'Certificate Expiry Reminder',
        body: message,
      },
    });

    console.log('Push notification sent:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = sendPushNotification;
