import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

// =============================================================================
// CONFIGURATION
// =============================================================================

// JWT Secret - MUST be set in production environment
const JWT_SECRET_STRING = process.env.SUPER_ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET_STRING && process.env.NODE_ENV === 'production') {
  throw new Error('SUPER_ADMIN_JWT_SECRET environment variable is required in production');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING || 'dev-only-secret-change-me');

const COOKIE_NAME = 'super_admin_token';
const TOKEN_EXPIRY = '8h'; // Shorter expiry for security
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// =============================================================================
// TYPES
// =============================================================================

export interface SuperAdminUser {
  id: string;
  email: string;
  name: string;
  tokenVersion: number;
}

export interface SuperAdminTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  tokenVersion: number;
}

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

// =============================================================================
// IN-MEMORY STORES (Use Redis/Valkey in production for multi-instance)
// =============================================================================

// Token version storage - increment to invalidate all tokens for a user
const tokenVersions: Map<string, number> = new Map();

// Rate limiting storage - track failed login attempts
const loginAttempts: Map<string, LoginAttempt> = new Map();

// =============================================================================
// CREDENTIAL VALIDATION
// =============================================================================

// Get credentials from environment variables (secure)
function getSuperAdminCredentials() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const passwordHash = process.env.SUPER_ADMIN_PASSWORD_HASH;

  // In development, allow fallback credentials
  if (process.env.NODE_ENV !== 'production') {
    return {
      email: email || 'admin@madriam.com',
      passwordHash: passwordHash || simpleHash('madriam-super-admin-2024'),
      name: 'Super Admin',
      id: 'super-admin-1',
    };
  }

  // In production, require environment variables
  if (!email || !passwordHash) {
    console.error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD_HASH must be set in production');
    return null;
  }

  return {
    email,
    passwordHash,
    name: 'Super Admin',
    id: 'super-admin-1',
  };
}

// Simple hash function for password comparison (use bcrypt in production)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Check if IP/identifier is rate limited
 */
export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    return { allowed: true };
  }

  // Check if locked out
  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    const retryAfter = Math.ceil((attempt.lockedUntil - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Reset if lockout expired
  if (attempt.lockedUntil && attempt.lockedUntil <= now) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };

  attempt.count += 1;
  attempt.lastAttempt = now;

  // Lock out after max attempts
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  loginAttempts.set(identifier, attempt);
}

/**
 * Clear login attempts on successful login
 */
export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

// =============================================================================
// CREDENTIAL VALIDATION
// =============================================================================

/**
 * Validate super admin credentials
 * Returns null on failure (don't reveal why it failed)
 */
export function validateCredentials(email: string, password: string): SuperAdminUser | null {
  const credentials = getSuperAdminCredentials();

  if (!credentials) {
    return null;
  }

  // Use constant-time comparison to prevent timing attacks
  const emailMatch = constantTimeCompare(email.toLowerCase(), credentials.email.toLowerCase());
  const passwordMatch = constantTimeCompare(simpleHash(password), credentials.passwordHash);

  if (!emailMatch || !passwordMatch) {
    return null;
  }

  const userId = credentials.id;

  // Initialize token version if not exists
  if (!tokenVersions.has(userId)) {
    tokenVersions.set(userId, 1);
  }

  return {
    id: userId,
    email: credentials.email,
    name: credentials.name,
    tokenVersion: tokenVersions.get(userId)!,
  };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still compare to maintain constant time
    b = a;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0 && a.length === b.length;
}

// =============================================================================
// JWT TOKEN MANAGEMENT
// =============================================================================

/**
 * Generate JWT token for super admin
 */
export async function generateToken(user: SuperAdminUser): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    tokenVersion: user.tokenVersion,
  } as SuperAdminTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setSubject(user.id)
    .setIssuer('madriam-super-admin')
    .setAudience('madriam-platform')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify JWT token and check if it's not invalidated
 */
export async function verifyToken(token: string): Promise<SuperAdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'madriam-super-admin',
      audience: 'madriam-platform',
    });

    const tokenPayload = payload as SuperAdminTokenPayload;

    // Check if token version matches (not invalidated by logout)
    const currentVersion = tokenVersions.get(tokenPayload.userId) || 1;
    if (tokenPayload.tokenVersion !== currentVersion) {
      // Token has been invalidated (user logged out)
      return null;
    }

    return tokenPayload;
  } catch {
    return null;
  }
}

/**
 * Invalidate all tokens for a user (logout)
 */
export function invalidateUserTokens(userId: string): void {
  const currentVersion = tokenVersions.get(userId) || 1;
  tokenVersions.set(userId, currentVersion + 1);
}

// =============================================================================
// COOKIE MANAGEMENT
// =============================================================================

/**
 * Get current user from cookie
 */
export async function getCurrentUser(): Promise<SuperAdminTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Set auth cookie with secure flags
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Stricter than 'lax' for better CSRF protection
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours (match token expiry)
  });
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// =============================================================================
// MIDDLEWARE HELPERS
// =============================================================================

/**
 * Check if request has valid super admin auth (for middleware use)
 */
export async function checkSuperAdminAuth(request: Request): Promise<SuperAdminTokenPayload | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookiesMap = parseCookies(cookieHeader);
  const token = cookiesMap[COOKIE_NAME];

  if (!token) return null;

  return verifyToken(token);
}

/**
 * Parse cookies from header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookiesMap: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookiesMap[name] = decodeURIComponent(value);
    }
  });
  return cookiesMap;
}

export { COOKIE_NAME };
