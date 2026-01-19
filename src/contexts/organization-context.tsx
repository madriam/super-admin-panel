'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { organizationsApi } from '@/lib/api/ontology';
import type { Organization, OrganizationSummary } from '@/lib/api/types';

const ORG_STORAGE_KEY = 'selected_org_id';

interface OrganizationContextType {
  selectedOrg: Organization | null;
  setSelectedOrg: (org: Organization | null) => void;
  selectOrgById: (orgId: string) => Promise<void>;
  isLoading: boolean;
  organizations: OrganizationSummary[];
  refreshOrganizations: () => Promise<OrganizationSummary[]>;
  tenantId: string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrg, setSelectedOrgState] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrganizations = useCallback(async () => {
    try {
      const orgs = await organizationsApi.list({ is_active: true });
      setOrganizations(orgs);
      return orgs;
    } catch (error) {
      console.error('Failed to load organizations:', error);
      return [];
    }
  }, []);

  const selectOrgById = useCallback(async (orgId: string) => {
    try {
      const org = await organizationsApi.get(orgId);
      setSelectedOrgState(org);
      localStorage.setItem(ORG_STORAGE_KEY, orgId);
    } catch (error) {
      console.error('Failed to load organization:', error);
      localStorage.removeItem(ORG_STORAGE_KEY);
    }
  }, []);

  const setSelectedOrg = useCallback((org: Organization | null) => {
    setSelectedOrgState(org);
    if (org) {
      localStorage.setItem(ORG_STORAGE_KEY, org.id);
    } else {
      localStorage.removeItem(ORG_STORAGE_KEY);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // Load organizations list
        const orgs = await refreshOrganizations();

        // Try to restore selected org from localStorage
        const savedOrgId = localStorage.getItem(ORG_STORAGE_KEY);
        if (savedOrgId) {
          // Verify the saved org still exists and is active
          const orgExists = orgs.some((o) => o.id === savedOrgId);
          if (orgExists) {
            await selectOrgById(savedOrgId);
          } else {
            localStorage.removeItem(ORG_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to initialize organization context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [refreshOrganizations, selectOrgById]);

  const tenantId = selectedOrg?.tenant_id ?? null;

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrg,
        setSelectedOrg,
        selectOrgById,
        isLoading,
        organizations,
        refreshOrganizations,
        tenantId,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
