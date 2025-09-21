const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

async function fixMissingUserIds() {
  try {
    console.log('🔧 Starting to fix missing userId fields...');
    
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);
    
    let fixedCount = 0;
    const updatePromises = [];
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      
      if (!data.userId) {
        console.log(`📝 Found report without userId: ${docSnapshot.id}`);
        
        // Create a placeholder userId based on user email or name
        let placeholderUserId = 'unknown-user';
        
        if (data.userEmail) {
          // Create a basic userId from email
          placeholderUserId = data.userEmail.replace('@', '-').replace('.', '-');
        } else if (data.userName || data.reporterName) {
          // Create a basic userId from name
          const name = data.userName || data.reporterName;
          placeholderUserId = name.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
        
        // Add a timestamp to make it unique
        placeholderUserId += '-' + Date.now().toString().slice(-6);
        
        console.log(`   -> Assigning userId: ${placeholderUserId}`);
        
        const updatePromise = updateDoc(doc(db, 'reports', docSnapshot.id), {
          userId: placeholderUserId
        });
        
        updatePromises.push(updatePromise);
        fixedCount++;
      }
    });
    
    if (updatePromises.length > 0) {
      console.log(`⏳ Updating ${updatePromises.length} documents...`);
      await Promise.all(updatePromises);
      console.log(`✅ Successfully fixed ${fixedCount} documents with missing userId`);
    } else {
      console.log('✅ No documents need fixing - all have userId fields');
    }
    
  } catch (error) {
    console.error('❌ Error fixing missing userIds:', error);
  }
}

fixMissingUserIds();
