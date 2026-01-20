'use client';

import { useImpersonation } from '@/contexts/impersonation-context';
import { Eye, ArrowLeft, Building2 } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedOrgName, impersonatedOrg, endImpersonation, isLoading } =
    useImpersonation();

  if (isLoading || !isImpersonating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-900">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5" />
            <span className="font-medium">Voce esta visualizando como admin de:</span>
            <div className="flex items-center gap-2 bg-yellow-400 px-3 py-1 rounded-full">
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">
                {impersonatedOrgName || impersonatedOrg?.name || 'Organizacao'}
              </span>
            </div>
            {impersonatedOrg && (
              <span className="text-sm opacity-75">({impersonatedOrg.plan})</span>
            )}
          </div>
          <button
            onClick={endImpersonation}
            className="flex items-center gap-2 px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Super Admin
          </button>
        </div>
      </div>
    </div>
  );
}
