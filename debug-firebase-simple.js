const { initializeApp } = require('firebase/app');
const { getAuth, onAuthStateChanged } = require('firebase/auth');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'auth-swapper',
  appId: '1:51956206240:web:a58a127864ff743c4317c5',
  storageBucket: 'auth-swapper.firebasestorage.app',
  apiKey: 'AIzaSyBKDCz78kJ5nDcfCW9JGxlCs6yC4ieT7M8',
  authDomain: 'auth-swapper.firebaseapp.com',
  messagingSenderId: '51956206240',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🔍 Starting authentication and Firebase debugging...');

async function testUndefinedDocId() {
  try {
    console.log('🧪 Testing doc() with undefined ID...');
    
    // This should reproduce the error
    try {
      const undefinedId = undefined;
      const docRef = doc(db, 'users', undefinedId);
      console.log('❌ This should have failed but didnt:', docRef);
    } catch (error) {
      console.log('✅ Caught expected error for undefined doc ID:', error.message);
    }
    
    // Test with null
    try {
      const nullId = null;
      const docRef = doc(db, 'users', nullId);
      console.log('❌ This should have failed but didnt:', docRef);
    } catch (error) {
      console.log('✅ Caught expected error for null doc ID:', error.message);
    }
    
    // Test with empty string
    try {
      const emptyId = '';
      const docRef = doc(db, 'users', emptyId);
      console.log('❌ This should have failed but didnt:', docRef);
    } catch (error) {
      console.log('✅ Caught expected error for empty doc ID:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testBasicConnection() {
  try {
    console.log('📱 Testing basic Firestore connection...');
    
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);
    console.log('✅ Successfully accessed reports collection:', snapshot.size, 'documents');
    
    // Check for documents with missing userIds
    let documentsWithIssues = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.userId) {
        console.log('⚠️ Found document without userId:', doc.id, data);
        documentsWithIssues++;
      }
    });
    
    console.log('📊 Documents with missing userId:', documentsWithIssues);
    
  } catch (error) {
    console.error('❌ Basic connection test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message
    });
  }
}

// Run tests
testUndefinedDocId();
testBasicConnection();
