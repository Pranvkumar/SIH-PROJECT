/**
 * Test Firebase Storage Upload
 * This script tests if we can upload files to the correct Firebase Storage bucket
 */

require('dotenv').config({ path: '.env.local' });

async function testStorageUpload() {
    try {
        console.log('🔍 Testing Firebase Storage upload...');
        
        // Import Firebase Admin modules
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getStorage } = await import('firebase-admin/storage');
        
        // Parse service account
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        
        // Initialize Firebase Admin
        if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccount),
                storageBucket: 'auth-swapper.firebasestorage.app',
            });
            console.log('✅ Firebase Admin SDK initialized with correct bucket');
        }
        
        // Test storage upload
        const storage = getStorage();
        const bucket = storage.bucket();
        
        console.log(`📦 Using bucket: ${bucket.name}`);
        
        // Create a test file
        const testContent = 'This is a test file for Firebase Storage';
        const testFileName = `test/test-${Date.now()}.txt`;
        const file = bucket.file(testFileName);
        
        console.log(`📁 Uploading test file: ${testFileName}`);
        
        // Upload the test file
        await file.save(testContent, {
            metadata: { contentType: 'text/plain' },
        });
        
        console.log('✅ File uploaded successfully');
        
        // Make it public to test URL generation
        await file.makePublic();
        const publicUrl = file.publicUrl();
        
        console.log(`🔗 Public URL: ${publicUrl}`);
        
        // Clean up - delete the test file
        await file.delete();
        console.log('✅ Test file cleaned up');
        
        console.log('\n🎉 Firebase Storage test successful!');
        console.log('✅ Your report submission should now work correctly.');
        
    } catch (error) {
        console.error('❌ Firebase Storage test failed:', error.message);
        console.error('📋 Full error:', error);
    }
}

testStorageUpload();
