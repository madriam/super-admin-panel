/**
 * Firebase Admin SDK stub - authentication disabled for initial deployment
 * TODO: Implement proper server-side authentication when needed
 */

// Stub exports
export const adminAuth = null;

/**
 * Verify a token - currently always returns valid for development
 */
export async function verifyIdToken(_token: string) {
  // Auth disabled - always return valid
  return { valid: true, uid: 'mock-uid', email: 'admin@madriam.com' };
}
