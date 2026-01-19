import NextAuth, { type NextAuthConfig } from 'next-auth';

/**
 * Zitadel OIDC Provider Configuration (PKCE - No Client Secret)
 *
 * Required environment variables:
 * - ZITADEL_ISSUER: https://auth.ilhaperdida.com.br
 * - ZITADEL_CLIENT_ID: From Zitadel console
 * - NEXTAUTH_SECRET: Random 32-byte secret
 * - NEXTAUTH_URL: https://admin.ilhaperdida.com.br
 */

// Custom Zitadel provider with PKCE
const ZitadelProvider = {
  id: 'zitadel',
  name: 'Zitadel',
  type: 'oidc' as const,
  issuer: process.env.ZITADEL_ISSUER,
  clientId: process.env.ZITADEL_CLIENT_ID,
  clientSecret: '', // Not required for PKCE
  checks: ['pkce', 'state'] as const,
  authorization: {
    params: {
      scope: 'openid profile email urn:zitadel:iam:org:project:id:zitadel:aud',
    },
  },
  profile(profile: {
    sub: string;
    name?: string;
    preferred_username?: string;
    email?: string;
    picture?: string;
    'urn:zitadel:iam:org:id'?: string;
    'urn:zitadel:iam:user:metadata'?: { roles?: string[] };
  }) {
    return {
      id: profile.sub,
      name: profile.name || profile.preferred_username,
      email: profile.email,
      image: profile.picture,
      // Custom fields from Zitadel
      orgId: profile['urn:zitadel:iam:org:id'],
      roles: profile['urn:zitadel:iam:user:metadata']?.roles || [],
    };
  },
};

export const authConfig: NextAuthConfig = {
  providers: [ZitadelProvider],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = !request.nextUrl.pathname.startsWith('/login');
      const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth');

      // Always allow auth API routes
      if (isApiAuth) return true;

      // If trying to access dashboard without being logged in
      if (isOnDashboard && !isLoggedIn) {
        return false; // Redirect to login
      }

      // If logged in and trying to access login page, redirect to dashboard
      if (isLoggedIn && !isOnDashboard) {
        return Response.redirect(new URL('/', request.nextUrl));
      }

      return true;
    },
    jwt({ token, user, account }) {
      // First login - add user data to token
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.orgId = (user as { orgId?: string }).orgId;
        token.roles = (user as { roles?: string[] }).roles || [];
      }
      return token;
    },
    session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.sub as string;
        (session.user as { orgId?: string; roles?: string[]; accessToken?: string }).orgId = token.orgId as string;
        (session.user as { orgId?: string; roles?: string[]; accessToken?: string }).roles = token.roles as string[];
        (session.user as { orgId?: string; roles?: string[]; accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Type augmentation for extended session/user
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      orgId?: string;
      roles?: string[];
      accessToken?: string;
    };
  }

  interface User {
    orgId?: string;
    roles?: string[];
  }
}
