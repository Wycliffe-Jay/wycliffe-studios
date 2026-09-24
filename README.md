# Wycliffe Studios

Vite + React + Firebase portfolio site for Wycliffe Studios.

## Vercel
Build command: npm run build
Output directory: dist
Framework: Vite

Set these Vercel environment variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID.

The portfolio source references the original /resources image paths. Those image binaries were not present in the AppDeploy source snapshot and still need to be added before those portfolio images display on Vercel.
