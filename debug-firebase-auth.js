import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/lib/firebase.js';

console.log('🔍 Starting authentication and Firebase debugging...');

// Test Firebase connection
async function testFirebase() {
  try {
    console.log('📱 Testing basic Firebase connection...');
    
    // Test authentication state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 Auth state:', user ? {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      } : 'No user logged in');
      
      if (user) {
        try {
          console.log('🔍 Testing Firestore with authenticated user...');
          
          // Test user document access
          console.log('📄 Accessing user document...');
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          console.log('✅ User document exists:', userDoc.exists());
          if (userDoc.exists()) {
            console.log('📊 User data:', userDoc.data());
          }
          
          // Test collections access
          const collections = ['reports', 'notifications', 'emergencyAlerts'];
          for (const collectionName of collections) {
            try {
              console.log(`📂 Testing collection: ${collectionName}`);
              const querySnapshot = await getDocs(collection(db, collectionName));
              console.log(`✅ ${collectionName}: ${querySnapshot.size} documents`);
            } catch (error) {
              console.error(`❌ ${collectionName} error:`, error.message);
            }
          }
          
        } catch (error) {
          console.error('❌ Firestore test with user failed:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
        }
      } else {
        console.log('⚠️ No user authenticated - testing anonymous access...');
        
        try {
          // Test if we can access collections without authentication
          const querySnapshot = await getDocs(collection(db, 'reports'));
          console.log('✅ Anonymous access to reports:', querySnapshot.size, 'documents');
        } catch (error) {
          console.error('❌ Anonymous access failed:', error.message);
        }
      }
      
      // Cleanup
      unsubscribe();
    });
    
  } catch (error) {
    console.error('❌ Firebase initialization test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

testFirebase();
