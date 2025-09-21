// Test script to check reports in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyD1bFWQM7M8J4pEWHO4E6zVVgCO1rT-rjQ",
  authDomain: "auth-swapper.firebaseapp.com",
  projectId: "auth-swapper",
  storageBucket: "auth-swapper.firebasestorage.app",
  messagingSenderId: "509336301635",
  appId: "1:509336301635:web:1b34dc2bc7d1f2b1e8b0b9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkReports() {
  try {
    console.log('Fetching all reports from Firestore...');
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);
    
    console.log('Total reports found:', snapshot.size);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Report ID:', doc.id);
      console.log('User ID:', data.userId);
      console.log('Event Type:', data.eventType);
      console.log('Status:', data.status);
      console.log('Created At:', data.createdAt);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkReports();
