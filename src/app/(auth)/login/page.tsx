'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Login page - redirects to home since auth is disabled
 * TODO: Implement proper authentication when needed
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Auth disabled - redirect to home
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Admin Panel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Redirecionando...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    </div>
  );
}
