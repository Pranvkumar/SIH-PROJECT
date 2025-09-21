/**
 * Quick test script for Firebase permissions after applying the fix
 * Run: node test-permissions-fix.js
 */

require('dotenv').config({ path: '.env.local' });

async function testPermissionsFix() {
    try {
        console.log('🔍 Testing Firebase permissions fix...');
        
        // Import Firebase modules
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');
        
        // Check environment variable
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
        }
        
        // Parse service account
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log(`📋 Testing with project: ${serviceAccount.project_id}`);
        console.log(`📧 Service account: ${serviceAccount.client_email}`);
        
        // Initialize Firebase Admin if not already initialized
        if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccount),
            });
            console.log('✅ Firebase Admin SDK initialized');
        }
        
        const db = getFirestore();
        
        // Test the exact query that was failing
        console.log('\n🔧 Testing the problematic notification query...');
        try {
            const notificationsQuery = db.collection('notifications')
                .where('targetRoles', 'array-contains', 'official')
                .orderBy('timestamp', 'desc')
                .limit(5);
            
            const result = await notificationsQuery.get();
            console.log(`✅ SUCCESS! Query returned ${result.docs.length} documents`);
            
            if (result.docs.length > 0) {
                console.log('📄 Sample notification:');
                const doc = result.docs[0];
                console.log(`  ID: ${doc.id}`);
                console.log(`  Target roles: ${doc.data().targetRoles?.join(', ') || 'none'}`);
                console.log(`  Title: ${doc.data().title || 'No title'}`);
            }
            
        } catch (queryError) {
            console.error('❌ QUERY STILL FAILING:', queryError.message);
            
            if (queryError.message.includes('UNAUTHENTICATED')) {
                console.log('\n💡 Service account still needs proper IAM roles:');
                console.log('   1. Go to: https://console.cloud.google.com/iam-admin/iam?project=' + serviceAccount.project_id);
                console.log('   2. Find: ' + serviceAccount.client_email);
                console.log('   3. Add roles: Cloud Datastore User, Firebase Admin SDK Service Account');
            }
            
            if (queryError.message.includes('index')) {
                console.log('\n💡 Missing Firestore index:');
                console.log('   Run: firebase deploy --only firestore:indexes');
            }
            
            return false;
        }
        
        // Test basic collection access
        console.log('\n🔧 Testing basic collection access...');
        const collections = ['users', 'notifications', 'reports'];
        
        for (const collection of collections) {
            try {
                const snapshot = await db.collection(collection).limit(1).get();
                console.log(`✅ ${collection}: Access granted (${snapshot.docs.length} docs)`);
            } catch (error) {
                console.log(`❌ ${collection}: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Firebase permissions test completed!');
        console.log('\n🔄 Next steps:');
        console.log('   1. Restart your Next.js development server: npm run dev');
        console.log('   2. Login as an official user');
        console.log('   3. Navigate to Dashboard > Social Media');
        console.log('   4. The Firebase permissions error should be gone!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Permissions test failed:', error.message);
        
        if (error.message.includes('UNAUTHENTICATED') || error.message.includes('authentication')) {
            console.log('\n🔧 SOLUTION: Fix service account IAM roles');
            console.log('   Follow the instructions in FIX-FIREBASE-PERMISSIONS.md');
        }
        
        return false;
    }
}

testPermissionsFix();
