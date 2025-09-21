/**
 * Test script to verify Firebase Admin SDK is working
 * Run: node test-firebase.js
 */

require('dotenv').config({ path: '.env.local' });

async function testFirebaseAdmin() {
    try {
        console.log('🔍 Testing Firebase Admin SDK initialization...');
        
        // Import Firebase Admin modules
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');
        const { getStorage } = await import('firebase-admin/storage');
        
        // Check environment variable
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
        }
        
        console.log('✅ Environment variable found');
        
        // Parse service account
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Service account parsed successfully');
        console.log(`📋 Project ID: ${serviceAccount.project_id}`);
        console.log(`📧 Client Email: ${serviceAccount.client_email}`);
        
        // Initialize Firebase Admin if not already initialized
        if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccount),
                storageBucket: 'auth-swapper.appspot.com',
            });
            console.log('✅ Firebase Admin SDK initialized');
        } else {
            console.log('✅ Firebase Admin SDK already initialized');
        }
        
        // Test Firestore connection
        const db = getFirestore();
        console.log('✅ Firestore connection established');
        
        // Test Storage connection
        const storage = getStorage();
        console.log('✅ Storage connection established');
        
        // Test writing to Firestore (optional test document)
        const testDoc = await db.collection('test').add({
            message: 'Firebase Admin SDK test',
            timestamp: new Date(),
            success: true
        });
        console.log(`✅ Test document created with ID: ${testDoc.id}`);
        
        // Clean up test document
        await testDoc.delete();
        console.log('✅ Test document cleaned up');
        
        console.log('\n🎉 All Firebase Admin SDK tests passed!');
        console.log('🔗 Your report submission should now work correctly.');
        
    } catch (error) {
        console.error('❌ Firebase Admin SDK test failed:', error.message);
        console.error('📋 Full error:', error);
        process.exit(1);
    }
}

testFirebaseAdmin();
