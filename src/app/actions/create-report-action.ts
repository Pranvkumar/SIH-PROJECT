
'use server';

import { v4 as uuidv4 } from 'uuid';

// Define the input type for our action
interface CreateReportInput {
    userId: string;
    eventType: string;
    description: string;
    location: { lat: number; lng: number };
    photoDataUri: string;
}

// Initialize Firebase Admin SDK with better error handling
async function getFirebaseAdmin() {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const { getStorage } = await import('firebase-admin/storage');
    
    // Check if app is already initialized
    if (getApps().length === 0) {
        try {
            if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
            }
            
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            
            initializeApp({
                credential: cert(serviceAccount),
                storageBucket: 'auth-swapper.firebasestorage.app',
            });
            
            console.log('Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error("Failed to initialize Firebase Admin SDK:", error);
            throw error;
        }
    }
    
    return {
        db: getFirestore(),
        storage: getStorage()
    };
}


export async function createReport(input: CreateReportInput) {
    const { userId, eventType, description, location, photoDataUri } = input;
    
    try {
        // Initialize Firebase Admin
        const { db, storage } = await getFirebaseAdmin();

        // 1. Upload image to Firebase Storage
        const bucket = storage.bucket();

        const matches = photoDataUri.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return { success: false, error: 'Invalid photo data URI format.' };
        }
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `reports/${uuidv4()}.jpg`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
            metadata: { contentType: mimeType },
        });

        await file.makePublic();
        const photoUrl = file.publicUrl();

        // Import FieldValue for timestamp
        const { FieldValue } = await import('firebase-admin/firestore');

        // 2. Save report to Firestore
        await db.collection('reports').add({
            userId,
            eventType,
            description,
            location,
            photoUrl,
            createdAt: FieldValue.serverTimestamp(),
            status: 'new',
        });

        return { success: true, photoUrl };

    } catch (error: unknown) {
        console.error('Error in createReport server action:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
        return { success: false, error: errorMessage };
    }
}
