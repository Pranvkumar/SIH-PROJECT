/**
 * Alternative Firebase Admin SDK initialization with additional error handling
 * This helps diagnose service account issues
 */

require('dotenv').config({ path: '.env.local' });

async function diagnoseServiceAccount() {
    try {
        console.log('🔍 Diagnosing Firebase service account setup...');
        
        // Check environment variable
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
        }
        
        console.log('✅ Environment variable found');
        
        // Parse service account
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        
        // Validate service account structure
        const requiredFields = ['type', 'project_id', 'private_key', 'client_email', 'client_id'];
        const missingFields = requiredFields.filter(field => !serviceAccount[field]);
        
        if (missingFields.length > 0) {
            console.error('❌ Missing required fields in service account:', missingFields);
            return false;
        }
        
        console.log('✅ Service account structure valid');
        console.log(`📋 Project ID: ${serviceAccount.project_id}`);
        console.log(`📧 Client Email: ${serviceAccount.client_email}`);
        console.log(`🆔 Client ID: ${serviceAccount.client_id}`);
        
        // Try direct Google Cloud authentication
        console.log('\n🔧 Testing Google Cloud authentication...');
        
        // Import Google Auth Library directly
        const { GoogleAuth } = await import('google-auth-library');
        
        const auth = new GoogleAuth({
            credentials: serviceAccount,
            scopes: [
                'https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/datastore',
                'https://www.googleapis.com/auth/firebase.database'
            ]
        });
        
        try {
            const authClient = await auth.getClient();
            console.log('✅ Google Auth Library authentication successful');
            
            // Get access token
            const token = await authClient.getAccessToken();
            if (token.token) {
                console.log('✅ Access token obtained successfully');
            }
            
        } catch (authError) {
            console.error('❌ Google Auth Library failed:', authError.message);
            
            if (authError.message.includes('invalid_grant')) {
                console.log('\n💡 SOLUTION: The service account private key might be invalid or expired');
                console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
                console.log('   2. Generate a NEW private key');
                console.log('   3. Run: node setup-firebase.js /path/to/new-key.json');
                return false;
            }
        }
        
        // Try Firebase Admin SDK with different initialization
        console.log('\n🔧 Testing Firebase Admin SDK...');
        
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');
        
        // Clear any existing apps
        const existingApps = getApps();
        if (existingApps.length > 0) {
            for (const app of existingApps) {
                await app.delete();
            }
        }
        
        // Initialize with explicit configuration
        const app = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id,
            databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
        });
        
        console.log('✅ Firebase Admin app initialized');
        
        // Test Firestore connection
        const db = getFirestore(app);
        
        // Try a simple collection listing
        try {
            const collectionsSnapshot = await db.listCollections();
            console.log('✅ Firestore connection successful');
            console.log(`📁 Found ${collectionsSnapshot.length} collections`);
            
            if (collectionsSnapshot.length > 0) {
                console.log('📋 Collections:', collectionsSnapshot.map(c => c.id).join(', '));
            }
            
        } catch (firestoreError) {
            console.error('❌ Firestore connection failed:', firestoreError.message);
            return false;
        }
        
        // Test the specific notification query
        console.log('\n🔧 Testing notification query...');
        try {
            const notificationsRef = db.collection('notifications');
            const simpleQuery = await notificationsRef.limit(1).get();
            console.log(`✅ Simple notifications query works: ${simpleQuery.docs.length} docs`);
            
            // Try the complex query
            const complexQuery = await notificationsRef
                .where('targetRoles', 'array-contains', 'official')
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();
            console.log(`✅ Complex notifications query works: ${complexQuery.docs.length} docs`);
            
        } catch (queryError) {
            console.error('❌ Notification query failed:', queryError.message);
            
            if (queryError.message.includes('index')) {
                console.log('\n💡 SOLUTION: Missing Firestore composite index');
                console.log('   Run: firebase deploy --only firestore:indexes');
            }
            
            return false;
        }
        
        console.log('\n🎉 All Firebase tests passed!');
        console.log('🔄 The permissions issue should now be resolved.');
        console.log('\n📋 Next steps:');
        console.log('   1. Restart your development server: npm run dev');
        console.log('   2. Test the social media settings tab');
        
        return true;
        
    } catch (error) {
        console.error('❌ Service account diagnosis failed:', error.message);
        console.error('📋 Full error:', error);
        
        if (error.message.includes('JWT')) {
            console.log('\n💡 SOLUTION: JWT/Token issue - regenerate service account key');
        }
        
        return false;
    }
}

diagnoseServiceAccount();
