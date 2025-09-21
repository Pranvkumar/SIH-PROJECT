#!/usr/bin/env node

/**
 * Firebase Service Account Setup Helper
 * 
 * This script helps you set up your Firebase service account credentials.
 * 
 * Instructions:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Select your 'auth-swapper' project
 * 3. Go to Project Settings > Service Accounts tab
 * 4. Click "Generate new private key"
 * 5. Download the JSON file
 * 6. Run this script: node setup-firebase.js /path/to/your/service-account.json
 */

const fs = require('fs');
const path = require('path');

function setupFirebase(serviceAccountPath) {
    try {
        // Read the service account file
        const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountData);
        
        // Validate required fields
        const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
        for (const field of requiredFields) {
            if (!serviceAccount[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Convert to environment variable format
        const envValue = JSON.stringify(serviceAccount);
        
        // Read current .env.local
        const envPath = path.join(__dirname, '.env.local');
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Replace or add the Firebase service account key
        const newEnvLine = `FIREBASE_SERVICE_ACCOUNT_KEY=${envValue}`;
        
        if (envContent.includes('FIREBASE_SERVICE_ACCOUNT_KEY=')) {
            // Replace existing line
            envContent = envContent.replace(
                /FIREBASE_SERVICE_ACCOUNT_KEY=.*/,
                newEnvLine
            );
        } else {
            // Add new line
            envContent += envContent.endsWith('\n') ? '' : '\n';
            envContent += newEnvLine + '\n';
        }
        
        // Write back to .env.local
        fs.writeFileSync(envPath, envContent);
        
        console.log('✅ Firebase service account configured successfully!');
        console.log('✅ .env.local file updated');
        console.log('🔄 Please restart your development server for changes to take effect');
        
    } catch (error) {
        console.error('❌ Error setting up Firebase:', error.message);
        process.exit(1);
    }
}

// Check command line arguments
const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
    console.log('📋 Firebase Service Account Setup');
    console.log('');
    console.log('Usage: node setup-firebase.js <path-to-service-account.json>');
    console.log('');
    console.log('Steps:');
    console.log('1. Go to https://console.firebase.google.com');
    console.log('2. Select your "auth-swapper" project');
    console.log('3. Go to Project Settings > Service Accounts');
    console.log('4. Click "Generate new private key"');
    console.log('5. Download the JSON file');
    console.log('6. Run: node setup-firebase.js /path/to/downloaded-file.json');
    process.exit(0);
}

if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Service account file not found: ${serviceAccountPath}`);
    process.exit(1);
}

setupFirebase(serviceAccountPath);
