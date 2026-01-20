'use client';

import { SuperAdminSidebar } from '@/components/super-admin/sidebar';
import { useSuperAdminAuth } from '@/hooks/use-super-admin-auth';

function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useSuperAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
      </div>
    );
  }

  // If not loading, middleware has already verified auth
  // So we just render the content
  return <>{children}</>;
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminGuard>
      <div className="min-h-screen bg-slate-50">
        <SuperAdminSidebar />
        <main className="lg:pl-64">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </SuperAdminGuard>
  );
}
