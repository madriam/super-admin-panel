'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { organizationsApi } from '@/lib/api/ontology';
import type { Organization } from '@/lib/api/types';

const IMPERSONATION_ORG_ID_COOKIE = 'impersonation_org_id';
const IMPERSONATION_ORG_NAME_COOKIE = 'impersonation_org_name';

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedOrg: Organization | null;
  impersonatedOrgName: string | null;
  startImpersonation: (orgId: string) => Promise<void>;
  endImpersonation: () => void;
  isLoading: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [impersonatedOrg, setImpersonatedOrg] = useState<Organization | null>(null);
  const [impersonatedOrgName, setImpersonatedOrgName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for impersonation on mount
  useEffect(() => {
    const checkImpersonation = async () => {
      const orgId = getCookie(IMPERSONATION_ORG_ID_COOKIE);
      const orgName = getCookie(IMPERSONATION_ORG_NAME_COOKIE);

      if (orgId) {
        setImpersonatedOrgName(orgName);
        try {
          const org = await organizationsApi.get(orgId);
          setImpersonatedOrg(org);
        } catch (error) {
          console.error('Failed to load impersonated org:', error);
          // Clear invalid impersonation
          deleteCookie(IMPERSONATION_ORG_ID_COOKIE);
          deleteCookie(IMPERSONATION_ORG_NAME_COOKIE);
        }
      }
      setIsLoading(false);
    };

    checkImpersonation();
  }, []);

  const startImpersonation = useCallback(async (orgId: string) => {
    try {
      const org = await organizationsApi.get(orgId);
      setImpersonatedOrg(org);
      setImpersonatedOrgName(org.name);

      // Set cookies
      document.cookie = `${IMPERSONATION_ORG_ID_COOKIE}=${orgId}; path=/; max-age=3600; SameSite=Strict`;
      document.cookie = `${IMPERSONATION_ORG_NAME_COOKIE}=${encodeURIComponent(org.name)}; path=/; max-age=3600; SameSite=Strict`;
    } catch (error) {
      console.error('Failed to start impersonation:', error);
      throw error;
    }
  }, []);

  const endImpersonation = useCallback(() => {
    setImpersonatedOrg(null);
    setImpersonatedOrgName(null);
    deleteCookie(IMPERSONATION_ORG_ID_COOKIE);
    deleteCookie(IMPERSONATION_ORG_NAME_COOKIE);

    // Redirect back to super admin panel
    if (process.env.NODE_ENV === 'production') {
      window.location.href = 'https://admin.ilhaperdida.com.br/super';
    } else {
      window.location.href = '/super';
    }
  }, []);

  const isImpersonating = !!impersonatedOrg || !!impersonatedOrgName;

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedOrg,
        impersonatedOrgName,
        startImpersonation,
        endImpersonation,
        isLoading,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
