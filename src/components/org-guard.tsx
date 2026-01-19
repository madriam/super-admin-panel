'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Plus, Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/organization-context';

// Pages that don't require organization selection
const UNGUARDED_PATHS = ['/organizations', '/settings'];

interface OrgGuardProps {
  children: React.ReactNode;
}

export function OrgGuard({ children }: OrgGuardProps) {
  const { selectedOrg, organizations, isLoading, selectOrgById } = useOrganization();
  const pathname = usePathname();
  const router = useRouter();
  const hasRedirected = useRef(false);

  // Check if current page requires org selection
  const requiresOrg = !UNGUARDED_PATHS.some((path) => pathname.startsWith(path));

  // Derive modal visibility from state (no useState needed)
  const shouldShowModal = !isLoading && requiresOrg && !selectedOrg && organizations.length > 0;

  // Handle redirect when no orgs exist (side effect)
  useEffect(() => {
    if (!isLoading && requiresOrg && !selectedOrg && organizations.length === 0 && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push('/organizations?create=true');
    }
  }, [isLoading, requiresOrg, selectedOrg, organizations, router]);

  // Reset redirect flag when conditions change
  useEffect(() => {
    if (selectedOrg || organizations.length > 0) {
      hasRedirected.current = false;
    }
  }, [selectedOrg, organizations]);

  const handleSelectOrg = async (orgId: string) => {
    await selectOrgById(orgId);
  };

  const handleCreateOrg = () => {
    router.push('/organizations?create=true');
  };

  // Show loading while initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Carregando organizacoes...</p>
        </div>
      </div>
    );
  }

  // If page doesn't require org, render children
  if (!requiresOrg) {
    return <>{children}</>;
  }

  // If org is selected, render children
  if (selectedOrg) {
    return <>{children}</>;
  }

  // Show org selection modal
  if (shouldShowModal) {
    return (
      <>
        {/* Background overlay */}
        <div className="fixed inset-0 z-50 bg-black/50" />

        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Selecione uma Organizacao
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Escolha a organizacao que deseja gerenciar
              </p>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrg(org.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{org.name}</p>
                    <p className="text-sm text-gray-500 truncate">{org.slug}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleCreateOrg}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Criar Nova Organizacao
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Fallback loading state
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
    </div>
  );
}
