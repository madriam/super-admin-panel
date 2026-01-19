'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus, Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/organization-context';
import { useRouter } from 'next/navigation';

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export function OrgSelector() {
  const { selectedOrg, organizations, isLoading, selectOrgById } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrg = async (orgId: string) => {
    await selectOrgById(orgId);
    setIsOpen(false);
  };

  const handleNewOrg = () => {
    setIsOpen(false);
    router.push('/organizations?create=true');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative flex-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Building2 size={18} className="text-blue-600" />
        </div>
        <div className="flex-1 text-left min-w-0">
          {selectedOrg ? (
            <>
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedOrg.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {selectedOrg.slug}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Selecione uma organizacao
            </p>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {organizations.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <Building2 className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                <p className="text-sm">Nenhuma organizacao</p>
              </div>
            ) : (
              organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrg(org.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {org.name}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${PLAN_COLORS[org.plan]}`}>
                        {org.plan}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {org.slug}
                    </p>
                  </div>
                  {selectedOrg?.id === org.id && (
                    <Check size={18} className="text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-200">
            <button
              onClick={handleNewOrg}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-blue-600"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Plus size={16} />
              </div>
              <span className="text-sm font-medium">Nova Organizacao</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
