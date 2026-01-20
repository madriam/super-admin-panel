'use client';

import { OrgAdminSidebar } from '@/components/org-admin/sidebar';
import { OrganizationProvider } from '@/contexts/organization-context';
import { AuthorizationProvider } from '@/contexts/authorization-context';
import { ImpersonationProvider, useImpersonation } from '@/contexts/impersonation-context';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { OrgGuard } from '@/components/org-guard';

function OrgAdminContent({ children }: { children: React.ReactNode }) {
  const { isImpersonating } = useImpersonation();

  return (
    <div className={`min-h-screen bg-gray-50 ${isImpersonating ? 'pt-12' : ''}`}>
      <OrgAdminSidebar />
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">
          <OrgGuard>{children}</OrgGuard>
        </div>
      </main>
    </div>
  );
}

export default function OrgAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthorizationProvider>
      <OrganizationProvider>
        <ImpersonationProvider>
          <ImpersonationBanner />
          <OrgAdminContent>{children}</OrgAdminContent>
        </ImpersonationProvider>
      </OrganizationProvider>
    </AuthorizationProvider>
  );
}
