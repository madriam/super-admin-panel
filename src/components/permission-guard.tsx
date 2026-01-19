'use client';

import { ReactNode } from 'react';
import { useAuthorization, Permission } from '@/contexts/authorization-context';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

/**
 * PermissionGuard - Conditionally render content based on user permissions
 *
 * Usage:
 * ```tsx
 * // Single permission
 * <PermissionGuard permission="organizations:create">
 *   <CreateButton />
 * </PermissionGuard>
 *
 * // Multiple permissions (any)
 * <PermissionGuard permissions={['organizations:edit', 'organizations:delete']}>
 *   <ActionMenu />
 * </PermissionGuard>
 *
 * // Multiple permissions (all required)
 * <PermissionGuard permissions={['organizations:edit', 'organizations:delete']} requireAll>
 *   <AdminOnlyFeature />
 * </PermissionGuard>
 *
 * // With custom fallback
 * <PermissionGuard permission="settings:edit" fallback={<ReadOnlyView />}>
 *   <EditableSettings />
 * </PermissionGuard>
 *
 * // With access denied message
 * <PermissionGuard permission="organizations:create" showAccessDenied>
 *   <CreateOrgForm />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showAccessDenied = false,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuthorization();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showAccessDenied) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Acesso Negado
        </h3>
        <p className="text-sm text-gray-500">
          Voce nao tem permissao para acessar este recurso.
        </p>
      </div>
    );
  }

  return <>{fallback}</>;
}

/**
 * SuperAdminOnly - Shorthand for super admin only content
 */
export function SuperAdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isSuperAdmin } = useAuthorization();
  return isSuperAdmin ? <>{children}</> : <>{fallback}</>;
}

/**
 * OrgAdminOnly - Shorthand for org admin or higher content
 */
export function OrgAdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isOrgAdmin, isSuperAdmin } = useAuthorization();
  return isOrgAdmin || isSuperAdmin ? <>{children}</> : <>{fallback}</>;
}

/**
 * CanEdit - Shorthand for edit permissions
 */
export function CanEdit({
  children,
  resource,
  fallback = null,
}: {
  children: ReactNode;
  resource: string;
  fallback?: ReactNode;
}) {
  const permission = `${resource}:edit` as Permission;
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * CanDelete - Shorthand for delete permissions
 */
export function CanDelete({
  children,
  resource,
  fallback = null,
}: {
  children: ReactNode;
  resource: string;
  fallback?: ReactNode;
}) {
  const permission = `${resource}:delete` as Permission;
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * CanCreate - Shorthand for create permissions
 */
export function CanCreate({
  children,
  resource,
  fallback = null,
}: {
  children: ReactNode;
  resource: string;
  fallback?: ReactNode;
}) {
  const permission = `${resource}:create` as Permission;
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
