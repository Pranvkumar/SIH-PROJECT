// Test script to create some approved reports for demonstration
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDmFWwSAYpevHE7g6fJVNi4QSDJd6e_XQk",
  authDomain: "auth-swapper.firebaseapp.com",
  projectId: "auth-swapper",
  storageBucket: "auth-swapper.firebasestorage.app",
  messagingSenderId: "889325058899",
  appId: "1:889325058899:web:f6d86ed7d72a885d3b6f98"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestApprovedReports() {
  console.log('🧪 Creating test approved reports...');
  
  const testReports = [
    {
      location: { lat: 25.2048, lng: 55.2708 }, // Dubai Marina
      eventType: 'coastal_flooding',
      description: 'Severe flooding observed along Dubai Marina waterfront after high tide. Water levels reached walkway areas.',
      severity: 'high',
      status: 'approved',
      reporterName: 'Ahmed Al-Rashid',
      reporterEmail: 'ahmed@example.com',
      userId: 'test-user-1',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
      updatedBy: 'official-user-1'
    },
    {
      location: { lat: 25.1972, lng: 55.2744 }, // JBR Beach
      eventType: 'beach_erosion',
      description: 'Significant beach erosion noticed at JBR Beach. Shoreline has receded approximately 2 meters.',
      severity: 'medium',
      status: 'approved',
      reporterName: 'Sarah Johnson',
      reporterEmail: 'sarah@example.com',
      userId: 'test-user-2',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)), // 4 days ago
      updatedBy: 'official-user-1'
    },
    {
      location: { lat: 25.2867, lng: 55.3117 }, // Dubai Creek
      eventType: 'marine_pollution',
      description: 'Oil spill detected in Dubai Creek area. Visible oil film on water surface affecting marine life.',
      severity: 'critical',
      status: 'approved',
      reporterName: 'Mohammed Hassan',
      reporterEmail: 'mohammed@example.com',
      userId: 'test-user-3',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)), // 12 hours ago
      updatedBy: 'official-user-2'
    },
    {
      location: { lat: 25.2584, lng: 55.3644 }, // Dubai Festival City
      eventType: 'storm_surge',
      description: 'Storm surge damage to waterfront infrastructure. Protective barriers partially damaged.',
      severity: 'high',
      status: 'approved',
      reporterName: 'Lisa Chen',
      reporterEmail: 'lisa@example.com',
      userId: 'test-user-4',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
      updatedBy: 'official-user-1'
    },
    {
      location: { lat: 25.1310, lng: 55.1866 }, // Dubai South Beach
      eventType: 'infrastructure_damage',
      description: 'Coastal infrastructure damage due to recent weather conditions. Pier structure compromised.',
      severity: 'medium',
      status: 'approved',
      reporterName: 'Robert Taylor',
      reporterEmail: 'robert@example.com',
      userId: 'test-user-5',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)), // 6 days ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      updatedBy: 'official-user-2'
    },
    {
      location: { lat: 25.2419, lng: 55.2837 }, // Business Bay
      eventType: 'high_tide',
      description: 'Unusually high tide levels causing minor flooding in Business Bay waterfront areas.',
      severity: 'low',
      status: 'approved',
      reporterName: 'Fatima Al-Zahra',
      reporterEmail: 'fatima@example.com',
      userId: 'test-user-6',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)), // 8 hours ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)), // 4 hours ago
      updatedBy: 'official-user-1'
    }
  ];

  try {
    for (const report of testReports) {
      const docRef = await addDoc(collection(db, 'reports'), report);
      console.log(`✅ Created approved report: ${docRef.id} - ${report.eventType} (${report.severity})`);
    }
    
    console.log(`\n🎉 Successfully created ${testReports.length} test approved reports!`);
    console.log('📍 Reports are located around Dubai coastal areas');
    console.log('🗺️ You can now view them in the "Approved Map" section of the official dashboard');
    
  } catch (error) {
    console.error('❌ Error creating test reports:', error);
  }
}

createTestApprovedReports();
