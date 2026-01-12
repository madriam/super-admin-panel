/**
 * Firebase Admin SDK Configuration
 *
 * Used for server-side token verification and admin operations.
 * NEVER expose these credentials to the client.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (prevent re-initialization)
if (getApps().length === 0) {
  // Use service account from environment variable
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'chat-multi-tenant',
    });
  } else {
    // Fallback: try to use Application Default Credentials
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'chat-multi-tenant',
    });
  }
}

export const adminAuth = getAuth();

/**
 * Verify a Firebase ID token
 */
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { valid: true, uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { valid: false, uid: null, email: null };
  }
}
