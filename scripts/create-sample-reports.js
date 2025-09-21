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

async function createSampleApprovedReports() {
  const sampleReports = [
    {
      eventType: 'coastal damage',
      description: 'Severe coastal erosion observed after recent storm. Beach access road partially damaged.',
      location: { lat: 19.0760, lng: 72.8777 }, // Mumbai coast
      photoUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      status: 'approved',
      severity: 'high',
      userName: 'Ravi Sharma',
      userEmail: 'ravi@example.com',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
      alertIssued: false
    },
    {
      eventType: 'flooding',
      description: 'High tide flooding in coastal residential areas. Water level reached 2 feet in some houses.',
      location: { lat: 13.0827, lng: 80.2707 }, // Chennai coast  
      photoUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      status: 'approved',
      severity: 'critical',
      userName: 'Priya Nair',
      userEmail: 'priya@example.com',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)), // 3 hours ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
      alertIssued: false
    },
    {
      eventType: 'high waves',
      description: 'Unusually high waves observed near fishing harbor. Boats advised to stay in port.',
      location: { lat: 15.2993, lng: 74.1240 }, // Goa coast
      photoUrl: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      status: 'approved',
      severity: 'medium',
      userName: 'Jose D\'Silva',
      userEmail: 'jose@example.com',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)), // 6 hours ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 60 * 1000)), // 5 hours ago
      alertIssued: true,
      alertIssuedAt: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)), // 4 hours ago
      alertIssuedBy: 'analyst@corsair.test'
    },
    {
      eventType: 'unusual tides',
      description: 'Extremely low tide exposing unusual amount of seabed. Marine life observed in distress.',
      location: { lat: 11.9416, lng: 79.8083 }, // Puducherry coast
      photoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      status: 'approved',
      severity: 'medium',
      userName: 'Arun Kumar',
      userEmail: 'arun@example.com',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)), // 12 hours ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 60 * 1000)), // 10 hours ago
      alertIssued: false
    },
    {
      eventType: 'swell surge',
      description: 'Large ocean swells causing dangerous conditions for swimmers and surfers.',
      location: { lat: 8.5241, lng: 76.9366 }, // Kerala coast
      photoUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      status: 'approved',
      severity: 'high',
      userName: 'Meera Menon',
      userEmail: 'meera@example.com',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)), // 8 hours ago
      approvedAt: Timestamp.fromDate(new Date(Date.now() - 7 * 60 * 60 * 1000)), // 7 hours ago
      alertIssued: false
    }
  ];

  try {
    console.log('Creating sample approved reports...');
    
    for (const report of sampleReports) {
      const docRef = await addDoc(collection(db, 'reports'), report);
      console.log(`Created report with ID: ${docRef.id} - ${report.eventType}`);
    }
    
    console.log('Sample approved reports created successfully!');
    
  } catch (error) {
    console.error('Error creating sample reports:', error);
  }
}

createSampleApprovedReports();
