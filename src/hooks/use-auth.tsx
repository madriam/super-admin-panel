'use client';

import { createContext, useContext, ReactNode } from 'react';

/**
 * Simplified auth context - authentication disabled for initial deployment
 * TODO: Implement proper authentication when needed
 */

interface User {
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Mock user for development/initial deployment
const mockUser: User = {
  email: 'admin@madriam.com',
  displayName: 'Admin',
};

const AuthContext = createContext<AuthContextType>({
  user: mockUser,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const signOut = async () => {
    // No-op for now
    console.log('Sign out requested');
  };

  return (
    <AuthContext.Provider value={{ user: mockUser, loading: false, signOut }}>
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
 * HOC to protect routes - currently passes through all routes
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    return <Component {...props} />;
  };
}
