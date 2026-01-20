import { NextRequest, NextResponse } from 'next/server';
import {
  validateCredentials,
  generateToken,
  setAuthCookie,
  checkRateLimit,
  recordFailedAttempt,
  clearLoginAttempts,
} from '@/lib/super-admin-auth';

/**
 * Get client IP for rate limiting
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Muitas tentativas. Tente novamente mais tarde.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 900),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate input (generic error message)
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Credenciais invalidas' },
        { status: 401 }
      );
    }

    // Validate credentials
    const user = validateCredentials(email, password);
    if (!user) {
      // Record failed attempt for rate limiting
      recordFailedAttempt(clientIP);

      // Generic error message to prevent enumeration
      return NextResponse.json(
        { error: 'Credenciais invalidas' },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    clearLoginAttempts(clientIP);

    // Generate JWT token
    const token = await generateToken(user);

    // Set auth cookie
    await setAuthCookie(token);

    // Return success response (don't include sensitive info)
    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    // Generic error message
    return NextResponse.json(
      { error: 'Erro ao processar requisicao' },
      { status: 500 }
    );
  }
}
