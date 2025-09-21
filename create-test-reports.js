const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'auth-swapper',
  appId: '1:51956206240:web:a58a127864ff743c4317c5',
  storageBucket: 'auth-swapper.firebasestorage.app',
  apiKey: 'AIzaSyBKDCz78kJ5nDcfCW9JGxlCs6yC4ieT7M8',
  authDomain: 'auth-swapper.firebaseapp.com',
  messagingSenderId: '51956206240',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestApprovedReports() {
  try {
    const testReports = [
      {
        eventType: 'coastal_flooding',
        description: 'Severe coastal flooding observed near Dubai Marina. Water levels reached 2 meters above normal.',
        location: { lat: 25.077, lng: 55.1394 },
        severity: 'high',
        status: 'approved',
        userId: 'test-user-1',
        userName: 'Test Citizen 1',
        userEmail: 'citizen1@test.com',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
        approvedAt: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
        photoUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop'
      },
      {
        eventType: 'oil_spill',
        description: 'Small oil spill detected near Jumeirah Beach. Cleanup efforts required.',
        location: { lat: 25.2085, lng: 55.2376 },
        severity: 'medium',
        status: 'approved',
        userId: 'test-user-2',
        userName: 'Test Citizen 2',
        userEmail: 'citizen2@test.com',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 172800000)), // 2 days ago
        approvedAt: Timestamp.fromDate(new Date(Date.now() - 7200000)), // 2 hours ago
        photoUrl: 'https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=400&h=300&fit=crop'
      },
      {
        eventType: 'storm_surge',
        description: 'Significant storm surge affecting Palm Jumeirah coastline during recent weather event.',
        location: { lat: 25.1124, lng: 55.1390 },
        severity: 'critical',
        status: 'approved',
        userId: 'test-user-3',
        userName: 'Test Citizen 3',
        userEmail: 'citizen3@test.com',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 259200000)), // 3 days ago
        approvedAt: Timestamp.fromDate(new Date(Date.now() - 10800000)), // 3 hours ago
        photoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
      },
      {
        eventType: 'beach_erosion',
        description: 'Significant beach erosion observed at Kite Beach. Sand displacement affecting infrastructure.',
        location: { lat: 25.2326, lng: 55.2576 },
        severity: 'medium',
        status: 'approved',
        userId: 'test-user-4',
        userName: 'Test Citizen 4',
        userEmail: 'citizen4@test.com',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 345600000)), // 4 days ago
        approvedAt: Timestamp.fromDate(new Date(Date.now() - 14400000)), // 4 hours ago
        photoUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop'
      },
      {
        eventType: 'marine_pollution',
        description: 'Plastic waste accumulation spotted near Dubai Creek. Marine wildlife at risk.',
        location: { lat: 25.2697, lng: 55.3095 },
        severity: 'low',
        status: 'approved',
        userId: 'test-user-5',
        userName: 'Test Citizen 5',
        userEmail: 'citizen5@test.com',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 432000000)), // 5 days ago
        approvedAt: Timestamp.fromDate(new Date(Date.now() - 18000000)), // 5 hours ago
        photoUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop'
      }
    ];

    console.log('Creating test approved reports...');
    
    for (const report of testReports) {
      const docRef = await addDoc(collection(db, 'reports'), report);
      console.log(`✅ Created approved report: ${report.eventType} with ID: ${docRef.id}`);
    }
    
    console.log('\\n🎉 All test approved reports created successfully!');
    console.log('You should now see these reports on the live map.');
    
  } catch (error) {
    console.error('❌ Error creating test reports:', error);
  }
}

createTestApprovedReports();
