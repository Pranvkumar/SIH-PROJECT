// Debug script to check and create test notifications
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'auth-swapper'
  });
}

const db = admin.firestore();

async function checkAndCreateTestNotifications() {
  try {
    console.log('🔍 Checking existing notifications...');
    
    // Check existing notifications
    const notificationsSnapshot = await db.collection('notifications').get();
    console.log(`Found ${notificationsSnapshot.docs.length} existing notifications`);
    
    notificationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.title} (${data.priority}) - Target: ${data.targetRoles}`);
    });
    
    // Create test notifications if none exist
    if (notificationsSnapshot.docs.length === 0) {
      console.log('\n📝 Creating test notifications...');
      
      // Test notification for analysts
      await db.collection('notifications').add({
        type: 'SYSTEM_ALERT',
        title: 'Test Notification for Analysts',
        message: 'This is a test notification to verify the notification system is working correctly.',
        targetRoles: ['analyst'],
        priority: 'MEDIUM',
        timestamp: admin.firestore.Timestamp.now(),
        read: false
      });
      
      // Test notification for officials
      await db.collection('notifications').add({
        type: 'SYSTEM_ALERT', 
        title: 'Test Notification for Officials',
        message: 'This is a test notification for officials to verify the notification system.',
        targetRoles: ['official'],
        priority: 'HIGH',
        timestamp: admin.firestore.Timestamp.now(),
        read: false
      });
      
      // Test notification for both
      await db.collection('notifications').add({
        type: 'EMERGENCY_ALERT',
        title: 'Test Emergency Alert',
        message: 'This is a test emergency notification visible to both analysts and officials.',
        targetRoles: ['analyst', 'official'],
        priority: 'CRITICAL',
        timestamp: admin.firestore.Timestamp.now(),
        read: false
      });
      
      console.log('✅ Created 3 test notifications');
    }
    
    // Check users and their roles
    console.log('\n👥 Checking user roles...');
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.name} (${data.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndCreateTestNotifications();
