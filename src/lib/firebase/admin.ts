import 'server-only';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_APP_NAME = 'crop-radar-admin';

function getFirebaseAdminApp() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const hasServiceAccount = Boolean(projectId && clientEmail && privateKey);
  const hasApplicationCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (!hasServiceAccount && !hasApplicationCredentials) {
    throw new Error('Firebase Admin credentials are not configured.');
  }

  const existingApp = getApps().find((app) => app.name === ADMIN_APP_NAME);
  return existingApp || initializeApp(
    {
      credential: hasServiceAccount
        ? cert({ projectId: projectId!, clientEmail: clientEmail!, privateKey: privateKey! })
        : applicationDefault(),
      ...(projectId ? { projectId } : {}),
    },
    ADMIN_APP_NAME
  );
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}