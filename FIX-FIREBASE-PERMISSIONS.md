# Fix for "FirebaseError: Missing or insufficient permissions"

## The Issue
The Firebase service account exists but lacks proper IAM roles to access Firestore. This causes authentication errors when the notification system tries to query the notifications collection.

## Solution Steps

### Step 1: Assign Proper IAM Roles to Service Account

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your `auth-swapper` project

2. **Navigate to Project Settings**
   - Click the ⚙️ settings icon
   - Select "Project settings"
   - Go to "Service accounts" tab

3. **Find Your Service Account**
   - You should see: `firebase-adminsdk-fbsvc@auth-swapper.iam.gserviceaccount.com`

4. **Go to Google Cloud IAM**
   - Click "Manage service account permissions" or
   - Visit: https://console.cloud.google.com/iam-admin/iam?project=auth-swapper

5. **Add Required Roles**
   - Find your service account: `firebase-adminsdk-fbsvc@auth-swapper.iam.gserviceaccount.com`
   - Click the ✏️ edit button
   - Add these roles:
     - **Cloud Datastore User** (for Firestore read/write)
     - **Firebase Admin SDK Service Account** (for Firebase operations)
     - **Service Account Token Creator** (for authentication)

### Step 2: Alternative - Quick Fix with Firebase Rules

If you can't access IAM settings, temporarily update your Firestore rules to be more permissive:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reports - temporary open access for debugging
    match /reports/{reportId} {
      allow read, write: if true;
    }
    
    // Alerts - temporary open access for debugging  
    match /alerts/{alertId} {
      allow read, write: if true;
    }
    
    // Emergency alerts - temporary open access
    match /emergencyAlerts/{alertId} {
      allow read, write: if true;
    }
    
    // Notifications - UPDATED: More permissive access
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null;
    }
    
    // Default deny rule
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Test the Fix

After applying the IAM roles, test with this command:

```bash
node debug-firebase-permissions.js
```

The script should now successfully connect and show:
- ✅ notifications collection accessible
- ✅ Exact query successful

### Step 4: Restart Development Server

After making changes:

```bash
npm run dev
```

Then test accessing the social media settings tab as an official user.

## What Was Happening

1. **User logs in as "official"** → ✅ Works (users collection has proper rules)
2. **Dashboard loads** → ✅ Works 
3. **NotificationSystem component loads** → ❌ Fails because:
   - The component tries to query `notifications` collection
   - Service account lacks proper Firestore permissions
   - Query fails with "Missing or insufficient permissions"
4. **Social media tab appears to have issues** → This was a red herring

## Root Cause

The error wasn't actually in the social media components - it was in the NotificationSystem component that loads on every dashboard page. The permission error was being thrown by the notification query, not the social media functionality.

## Prevention

To prevent this in the future:
1. Always assign proper IAM roles when creating Firebase service accounts
2. Use more specific error handling in Firebase queries
3. Test with both client-side and server-side Firebase operations

## Verification Commands

Test that everything works:

```bash
# Test Firebase Admin SDK
node test-firebase.js

# Test permissions specifically  
node debug-firebase-permissions.js

# Check if notifications work
node debug-notifications.js
```
