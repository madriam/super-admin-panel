'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';

/**
 * Role-Based Access Control (RBAC) System
 *
 * Roles:
 * - super_admin: Global access, can manage all organizations
 * - org_admin: Can manage their own organization
 * - agent: Can view conversations, handle handoffs
 * - viewer: Read-only access to dashboards
 */

// Permission definitions
export const PERMISSIONS = {
  // Organization management
  'organizations:list': ['super_admin'],
  'organizations:create': ['super_admin'],
  'organizations:edit': ['super_admin', 'org_admin'],
  'organizations:delete': ['super_admin'],
  'organizations:view_all': ['super_admin'],

  // Department management
  'departments:list': ['super_admin', 'org_admin', 'agent', 'viewer'],
  'departments:create': ['super_admin', 'org_admin'],
  'departments:edit': ['super_admin', 'org_admin'],
  'departments:delete': ['super_admin', 'org_admin'],

  // Agent management
  'agents:list': ['super_admin', 'org_admin', 'agent', 'viewer'],
  'agents:create': ['super_admin', 'org_admin'],
  'agents:edit': ['super_admin', 'org_admin'],
  'agents:delete': ['super_admin', 'org_admin'],

  // Queue management
  'queues:list': ['super_admin', 'org_admin', 'agent', 'viewer'],
  'queues:create': ['super_admin', 'org_admin'],
  'queues:edit': ['super_admin', 'org_admin'],
  'queues:delete': ['super_admin', 'org_admin'],

  // AI Agent management
  'ai_agents:list': ['super_admin', 'org_admin', 'agent', 'viewer'],
  'ai_agents:create': ['super_admin', 'org_admin'],
  'ai_agents:edit': ['super_admin', 'org_admin'],
  'ai_agents:delete': ['super_admin', 'org_admin'],

  // Integration management
  'integrations:list': ['super_admin', 'org_admin', 'viewer'],
  'integrations:create': ['super_admin', 'org_admin'],
  'integrations:edit': ['super_admin', 'org_admin'],
  'integrations:delete': ['super_admin', 'org_admin'],

  // Routing canvas
  'routing:view': ['super_admin', 'org_admin', 'agent', 'viewer'],
  'routing:edit': ['super_admin', 'org_admin'],

  // Settings
  'settings:view': ['super_admin', 'org_admin', 'viewer'],
  'settings:edit': ['super_admin', 'org_admin'],

  // Dashboard
  'dashboard:view': ['super_admin', 'org_admin', 'agent', 'viewer'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

interface AuthorizationContextType {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  userRoles: string[];
}

const AuthorizationContext = createContext<AuthorizationContextType | undefined>(undefined);

export function AuthorizationProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin, isOrgAdmin } = useAuth();

  const userRoles = useMemo(() => user?.roles || [], [user?.roles]);

  const hasPermission = (permission: Permission): boolean => {
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return userRoles.some((role) => (allowedRoles as readonly string[]).includes(role));
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  };

  const value = useMemo(
    () => ({
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isSuperAdmin,
      isOrgAdmin,
      userRoles,
    }),
    [userRoles, isSuperAdmin, isOrgAdmin]
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuthorization() {
  const context = useContext(AuthorizationContext);
  if (!context) {
    throw new Error('useAuthorization must be used within an AuthorizationProvider');
  }
  return context;
}
