import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Domain configuration
const SUPER_ADMIN_DOMAIN = 'super-admin.ilhaperdida.com.br';
const ORG_ADMIN_DOMAIN = 'panel.ilhaperdida.com.br';
const ORG_PANEL_WILDCARD = '.panel.ilhaperdida.com.br';

// Super Admin auth configuration
const SUPER_ADMIN_COOKIE = 'super_admin_token';

// Lazy-loaded JWT secret to avoid build-time errors
let _jwtSecret: Uint8Array | null = null;
function getJwtSecret(): Uint8Array {
  if (_jwtSecret) return _jwtSecret;
  const secretString = process.env.SUPER_ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-only-secret-change-me';
  _jwtSecret = new TextEncoder().encode(secretString);
  return _jwtSecret;
}

/**
 * Verify super admin JWT token in middleware
 */
async function verifySuperAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecret(), {
      issuer: 'madriam-super-admin',
      audience: 'madriam-platform',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get super admin token from request cookies
 */
function getSuperAdminToken(request: NextRequest): string | undefined {
  return request.cookies.get(SUPER_ADMIN_COOKIE)?.value;
}

export async function middleware(request: NextRequest) {
  const { pathname, host, origin } = request.nextUrl;
  const hostWithoutPort = host.split(':')[0];

  // Public routes that don't require authentication
  const publicRoutes = [
    '/super/login',
    '/login',
    '/api/auth',
    '/api/health',
    '/api/super/auth/login',
    '/api/super/auth/logout',
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Static assets don't need auth
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // ==========================================================================
  // SUPER ADMIN DOMAIN ROUTING (super-admin.ilhaperdida.com.br)
  // ==========================================================================
  const isSuperAdminDomain = hostWithoutPort === SUPER_ADMIN_DOMAIN;

  if (isSuperAdminDomain) {
    // Get super admin token
    const token = getSuperAdminToken(request);
    const isAuthenticated = token ? await verifySuperAdminToken(token) : false;

    // Allow public routes
    if (isPublicRoute) {
      // If already authenticated and trying to access login, redirect to dashboard
      if (isAuthenticated && pathname === '/super/login') {
        return NextResponse.redirect(new URL('/super', origin));
      }
      return NextResponse.next();
    }

    // Not authenticated - redirect to super admin login
    if (!isAuthenticated) {
      const loginUrl = new URL('/super/login', origin);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated - ensure they're on /super routes
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/super', origin));
    }

    // Block non-super routes on super admin domain
    if (!pathname.startsWith('/super') && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/super', origin));
    }

    // Add panel type header
    const response = NextResponse.next();
    response.headers.set('x-panel-type', 'super-admin');
    return response;
  }

  // ==========================================================================
  // ORG ADMIN WILDCARD ROUTING ({slug}.panel.ilhaperdida.com.br)
  // ==========================================================================
  const isOrgWildcardDomain = hostWithoutPort.endsWith(ORG_PANEL_WILDCARD);

  if (isOrgWildcardDomain) {
    // Extract org slug from subdomain
    const orgSlug = hostWithoutPort.replace(ORG_PANEL_WILDCARD, '');

    // For org admin panels, use Zitadel auth (existing flow)
    // This will be handled by the existing NextAuth setup

    // Add org slug to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-panel-type', 'org-admin');
    response.headers.set('x-org-slug', orgSlug);
    return response;
  }

  // ==========================================================================
  // GENERIC ORG ADMIN DOMAIN (panel.ilhaperdida.com.br)
  // ==========================================================================
  const isOrgAdminDomain = hostWithoutPort === ORG_ADMIN_DOMAIN;

  if (isOrgAdminDomain) {
    // Use existing Zitadel auth for org admin
    const response = NextResponse.next();
    response.headers.set('x-panel-type', 'org-admin');
    return response;
  }

  // ==========================================================================
  // LOCALHOST DEVELOPMENT MODE
  // ==========================================================================
  const isLocalhost = hostWithoutPort === 'localhost';

  if (isLocalhost) {
    // In development, check for super admin token first
    const superAdminToken = getSuperAdminToken(request);
    const isSuperAdminAuth = superAdminToken ? await verifySuperAdminToken(superAdminToken) : false;

    // If accessing /super routes, check super admin auth
    if (pathname.startsWith('/super')) {
      if (isPublicRoute) {
        // If authenticated and trying to access login, redirect to dashboard
        if (isSuperAdminAuth && pathname === '/super/login') {
          return NextResponse.redirect(new URL('/super', origin));
        }
        return NextResponse.next();
      }

      if (!isSuperAdminAuth) {
        return NextResponse.redirect(new URL('/super/login', origin));
      }

      const response = NextResponse.next();
      response.headers.set('x-panel-type', 'super-admin');
      return response;
    }

    // For other routes, allow access (existing NextAuth will handle org admin auth)
    const response = NextResponse.next();
    response.headers.set('x-panel-type', 'org-admin');
    return response;
  }

  // ==========================================================================
  // DEFAULT: Allow through
  // ==========================================================================
  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};
