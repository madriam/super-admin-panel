'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SuperAdminUser {
  name: string;
}

interface UseSuperAdminAuthReturn {
  user: SuperAdminUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export function useSuperAdminAuth(): UseSuperAdminAuthReturn {
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch the current user info
        const response = await fetch('/api/super/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/super/auth/logout', {
        method: 'POST',
      });
      setUser(null);
      router.push('/super/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  return {
    user,
    loading,
    logout,
  };
}
