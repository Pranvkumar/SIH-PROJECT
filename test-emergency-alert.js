const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Firebase configuration (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyC2wAcR3Kd9OHQxF1U8NnxDZy0GQf4XFaA",
  authDomain: "auth-swapper.firebaseapp.com",
  projectId: "auth-swapper",
  storageBucket: "auth-swapper.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestEmergencyAlert() {
  try {
    console.log('Creating test emergency alert...');
    
    // Test emergency alert data - using Dehradun, Bidholi location
    const testAlert = {
      id: `test_emergency_${Date.now()}`,
      title: 'Emergency Alert - Dehradun Area',
      message: 'Test emergency alert for Dehradun, Bidholi area. This alert should appear prominently on your dashboard if you are within 15km radius.',
      severity: 'critical',
      location: {
        lat: 30.2588,  // Dehradun, Bidholi coordinates
        lng: 78.0572
      },
      radius: 15000, // 15km radius
      issuedBy: 'test-analyst@dehradun.gov.in',
      issuedAt: Timestamp.now(),
      active: true,
      dismissedBy: []
    };

    const docRef = await addDoc(collection(db, 'emergencyAlerts'), testAlert);
    console.log('✅ Test emergency alert created successfully!');
    console.log('Document ID:', docRef.id);
    console.log('Alert details:', testAlert);
    console.log('\nNow check your dashboard at http://localhost:9002/dashboard');
    console.log('Since you are in Dehradun, Bidholi (30.2588, 78.0572), you should see this CRITICAL alert.');
    console.log('The alert should appear as a prominent red banner at the top of your dashboard!');
    
  } catch (error) {
    console.error('❌ Error creating test emergency alert:', error);
  }
}

createTestEmergencyAlert();
