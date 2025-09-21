const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function createAnalystUser() {
  try {
    const email = 'analyst@corsair.test';
    const password = 'analyst123';
    const name = 'Dr. Coastal Analyst';
    
    console.log('Creating analyst user...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created with UID:', user.uid);
    
    // Add user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: name,
      email: email,
      role: 'analyst',
      createdAt: new Date()
    });
    
    console.log('Analyst user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: analyst');
    
  } catch (error) {
    console.error('Error creating analyst user:', error);
  }
}

createAnalystUser();
