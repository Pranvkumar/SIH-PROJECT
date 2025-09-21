/**
 * Debug script to test Firebase permissions for official users
 * Run: node debug-firebase-permissions.js
 */

require('dotenv').config({ path: '.env.local' });

async function debugFirebasePermissions() {
    try {
        console.log('🔍 Debugging Firebase permissions for official users...');
        
        // Import Firebase modules
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');
        
        // Check environment variable
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
        }
        
        console.log('✅ Environment variable found');
        
        // Parse service account
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Service account parsed successfully');
        console.log(`📋 Project ID: ${serviceAccount.project_id}`);
        
        // Initialize Firebase Admin if not already initialized
        if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccount),
            });
            console.log('✅ Firebase Admin SDK initialized');
        }
        
        const db = getFirestore();
        
        // Test 1: Check if notifications collection exists and has data
        console.log('\n📋 Testing notifications collection...');
        const notificationsSnapshot = await db.collection('notifications').limit(5).get();
        console.log(`✅ Found ${notificationsSnapshot.docs.length} notification documents`);
        
        if (notificationsSnapshot.docs.length > 0) {
            console.log('📄 Sample notification structure:');
            const sampleDoc = notificationsSnapshot.docs[0];
            console.log(`  - ID: ${sampleDoc.id}`);
            console.log(`  - Data:`, JSON.stringify(sampleDoc.data(), null, 2));
        }
        
        // Test 2: Check for notifications targeting 'official' role
        console.log('\n📋 Testing notifications for "official" role...');
        const officialNotificationsQuery = db.collection('notifications')
            .where('targetRoles', 'array-contains', 'official');
        const officialNotifications = await officialNotificationsQuery.get();
        console.log(`✅ Found ${officialNotifications.docs.length} notifications for officials`);
        
        // Test 3: Test the exact query used by the notification system
        console.log('\n📋 Testing the exact query used by NotificationSystem...');
        try {
            const exactQuery = db.collection('notifications')
                .where('targetRoles', 'array-contains', 'official')
                .orderBy('timestamp', 'desc');
            const exactQueryResult = await exactQuery.get();
            console.log(`✅ Exact query successful: ${exactQueryResult.docs.length} documents`);
        } catch (queryError) {
            console.error('❌ Exact query failed:', queryError.message);
            console.log('🔍 This might be the cause of the permissions error!');
            
            // Check if it's an index issue
            if (queryError.message.includes('index')) {
                console.log('💡 Suggestion: This appears to be a missing index issue');
                console.log('   Run: firebase deploy --only firestore:indexes');
            }
        }
        
        // Test 4: Check other collections that might be causing issues
        console.log('\n📋 Testing other collections...');
        const collections = ['users', 'reports', 'alerts', 'emergencyAlerts'];
        
        for (const collectionName of collections) {
            try {
                const snapshot = await db.collection(collectionName).limit(1).get();
                console.log(`✅ ${collectionName}: ${snapshot.docs.length} documents accessible`);
            } catch (error) {
                console.error(`❌ ${collectionName}: Error - ${error.message}`);
            }
        }
        
        // Test 5: Check if there are any users with 'official' role
        console.log('\n📋 Testing official users...');
        const officialUsersQuery = await db.collection('users')
            .where('role', '==', 'official')
            .get();
        console.log(`✅ Found ${officialUsersQuery.docs.length} users with 'official' role`);
        
        if (officialUsersQuery.docs.length > 0) {
            console.log('👤 Official users:');
            officialUsersQuery.docs.forEach(doc => {
                const userData = doc.data();
                console.log(`  - ${userData.email} (${userData.name})`);
            });
        }
        
        console.log('\n🎉 Firebase permissions debugging complete!');
        
    } catch (error) {
        console.error('❌ Firebase permissions debugging failed:', error.message);
        console.error('📋 Full error:', error);
        
        if (error.message.includes('PERMISSION_DENIED')) {
            console.log('\n💡 Suggestions for PERMISSION_DENIED errors:');
            console.log('1. Check firestore.rules file');
            console.log('2. Ensure Firebase project has correct permissions');
            console.log('3. Verify service account has proper roles');
        }
        
        if (error.message.includes('index')) {
            console.log('\n💡 Suggestions for index errors:');
            console.log('1. Run: firebase deploy --only firestore:indexes');
            console.log('2. Check firestore.indexes.json configuration');
            console.log('3. Wait for indexes to build (can take several minutes)');
        }
        
        process.exit(1);
    }
}

debugFirebasePermissions();
