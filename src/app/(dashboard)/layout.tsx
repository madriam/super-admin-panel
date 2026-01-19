'use client';

import { Sidebar } from '@/components/sidebar';
import { OrganizationProvider } from '@/contexts/organization-context';
import { AuthorizationProvider } from '@/contexts/authorization-context';
import { OrgGuard } from '@/components/org-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthorizationProvider>
      <OrganizationProvider>
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <main className="lg:pl-64">
            <div className="p-6 lg:p-8">
              <OrgGuard>{children}</OrgGuard>
            </div>
          </main>
        </div>
      </OrganizationProvider>
    </AuthorizationProvider>
  );
}
