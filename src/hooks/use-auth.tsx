'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { createContext, useContext, ReactNode } from 'react';

/**
 * Authentication hook using NextAuth with Zitadel
 *
 * Provides user session data and authentication methods
 */

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  image?: string | null;
  orgId?: string;
  roles?: string[];
  accessToken?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? null,
        displayName: session.user.name ?? null,
        image: session.user.image,
        orgId: session.user.orgId,
        roles: session.user.roles,
        accessToken: session.user.accessToken,
      }
    : null;

  const loading = status === 'loading';

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: '/login' });
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const isSuperAdmin = hasRole('super_admin');
  const isOrgAdmin = hasRole('org_admin') || isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        isSuperAdmin,
        isOrgAdmin,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * HOC to protect routes - requires authentication
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }

    if (!user) {
      return null; // Middleware will redirect to login
    }

    return <Component {...props} />;
  };
}
