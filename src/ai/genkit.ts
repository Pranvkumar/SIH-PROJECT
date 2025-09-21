import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';


const firebaseConfig = {
  projectId: 'auth-swapper',
  appId: '1:51956206240:web:a58a127864ff743c4317c5',
  storageBucket: 'auth-swapper.appspot.com',
  apiKey: 'AIzaSyBKDCz78kJ5nDcfCW9JGxlCs6yC4ieT7M8',
  authDomain: 'auth-swapper.firebaseapp.com',
  messagingSenderId: '51956206240',
};

// Initialize Firebase for server-side flows
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig, "genkit-flows"); // Use a unique name for the app instance
} else {
  app = getApps().find(app => app.name === "genkit-flows") || initializeApp(firebaseConfig, "genkit-flows");
}


export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

export { app };
