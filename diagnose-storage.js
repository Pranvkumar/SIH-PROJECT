/**
 * Firebase Storage Diagnostic Script
 * This script helps diagnose Firebase Storage bucket issues
 */

require('dotenv').config({ path: '.env.local' });

async function diagnoseFirebaseStorage() {
    try {
        console.log('🔍 Diagnosing Firebase Storage configuration...');
        
        // Import Firebase Admin modules
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getStorage } = await import('firebase-admin/storage');
        
        // Parse service account
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log(`📋 Project ID: ${serviceAccount.project_id}`);
        
        // Initialize Firebase Admin if not already initialized
        if (getApps().length === 0) {
            // Try without specifying storage bucket first
            initializeApp({
                credential: cert(serviceAccount),
            });
            console.log('✅ Firebase Admin SDK initialized (without storage bucket)');
        }
        
        // Test different bucket names
        const possibleBuckets = [
            `${serviceAccount.project_id}.appspot.com`,
            `${serviceAccount.project_id}.firebasestorage.app`,
            serviceAccount.project_id,
        ];
        
        console.log('\n🔍 Testing possible bucket names:');
        
        for (const bucketName of possibleBuckets) {
            try {
                console.log(`\n📦 Testing bucket: ${bucketName}`);
                
                const storage = getStorage();
                const bucket = storage.bucket(bucketName);
                
                // Try to list files (this will fail if bucket doesn't exist)
                const [files] = await bucket.getFiles({ maxResults: 1 });
                console.log(`✅ Bucket ${bucketName} exists and is accessible`);
                console.log(`📊 Found ${files.length} files (showing first 1)`);
                
                return bucketName; // Return the working bucket name
                
            } catch (error) {
                console.log(`❌ Bucket ${bucketName} not accessible: ${error.message}`);
            }
        }
        
        console.log('\n⚠️  No accessible storage buckets found.');
        console.log('💡 You may need to enable Firebase Storage in the Firebase Console.');
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error.message);
        console.error('📋 Full error:', error);
    }
}

diagnoseFirebaseStorage();
