// Script to create old notifications for testing the clear functionality
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'auth-swapper'
  });
}

const db = admin.firestore();

async function createOldNotifications() {
  try {
    console.log('📝 Creating old notifications for testing clear functionality...');
    
    // Create notifications from different dates
    const dates = [
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      new Date(), // Now
    ];
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
      
      await db.collection('notifications').add({
        type: 'TEST_ALERT',
        title: `Test Notification ${i + 1} (${daysAgo} days old)`,
        message: `This is a test notification created ${daysAgo} days ago to test the clear old notifications feature.`,
        targetRoles: ['analyst', 'official'],
        priority: 'MEDIUM',
        timestamp: admin.firestore.Timestamp.fromDate(date),
        read: false
      });
      
      console.log(`✅ Created notification ${i + 1} (${daysAgo} days old)`);
    }
    
    console.log('🎉 All test notifications created successfully!');
    console.log('📋 Summary:');
    console.log('   - 2 notifications older than 5 days (should be cleared)');
    console.log('   - 3 notifications newer than 5 days (should remain)');
    
    // List all notifications with dates
    console.log('\n📋 Current notifications:');
    const snapshot = await db.collection('notifications').orderBy('timestamp', 'desc').get();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp.toDate();
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
      console.log(`- ${data.title} (${daysAgo} days old) - ${date.toLocaleDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  }
}

createOldNotifications();
