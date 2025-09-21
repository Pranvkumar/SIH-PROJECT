// Firebase Firestore Security Rules for Citizen Reporting App
// Copy these rules to your Firebase Console > Firestore Database > Rules

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to reports collection (your main collection)
    match /reports/{document} {
      allow read, write: if true; // Open for testing - restrict as needed
    }
    
    // Allow read/write access to citizenReports collection (legacy)
    match /citizenReports/{document} {
      allow read, write: if true; // Open for testing - restrict as needed
    }
    
    // Allow read/write access to test collection (for connection testing)
    match /test/{document} {
      allow read, write: if true;
    }
    
    // For production, you might want more restrictive rules like:
    /*
    match /reports/{document} {
      allow read: if true; // Anyone can read reports
      allow write: if request.auth != null; // Only authenticated users can write
    }
    */
  }
}

// Firebase Storage Security Rules (also update in Firebase Console > Storage > Rules)
/*
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{allPaths=**} {
      allow read, write: if true; // Open for testing - restrict as needed
    }
    
    // For production, you might want:
    match /reports/{allPaths=**} {
      allow read: if true; // Anyone can view reports
      allow write: if request.auth != null; // Only authenticated users can upload
    }
  }
}
*/
