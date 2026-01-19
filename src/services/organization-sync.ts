/**
 * Organization Sync Service
 *
 * Handles dual-creation of organizations in both:
 * 1. Zitadel (identity provider)
 * 2. Ontology Service (business data)
 *
 * When a Super Admin creates an organization:
 * 1. Create in Zitadel first (get Zitadel org ID)
 * 2. Create in Ontology Service with Zitadel org ID in sso_config
 * 3. Return unified result
 */

import {
  zitadelClient,
  CreateOrganizationRequest,
  ZitadelOrganization,
} from '@/lib/zitadel-client';

// Ontology Service API base URL
const ONTOLOGY_API_URL =
  process.env.NEXT_PUBLIC_ONTOLOGY_API_URL || 'https://ontology.ilhaperdida.com.br';

interface OntologyOrganization {
  id: string;
  name: string;
  slug: string;
  tenant_id: string;
  sso_config: {
    provider: string;
    org_id: string;
    enabled: boolean;
  };
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface CreateOrganizationInput {
  name: string;
  slug: string;
  tenant_id: string;
  admin?: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
  };
  settings?: Record<string, unknown>;
}

interface SyncedOrganization {
  zitadelOrg: ZitadelOrganization;
  ontologyOrg: OntologyOrganization;
}

class OrganizationSyncService {
  /**
   * Create organization in both systems
   */
  async createOrganization(input: CreateOrganizationInput): Promise<SyncedOrganization> {
    // Step 1: Create in Zitadel
    const zitadelRequest: CreateOrganizationRequest = {
      name: input.name,
      admins: input.admin
        ? [
            {
              userName: input.admin.email.split('@')[0],
              email: input.admin.email,
              firstName: input.admin.firstName,
              lastName: input.admin.lastName,
              password: input.admin.password,
            },
          ]
        : undefined,
    };

    let zitadelOrgId: string;
    try {
      const zitadelResponse = await zitadelClient.createOrganization(zitadelRequest);
      zitadelOrgId = zitadelResponse.organizationId;
    } catch (error) {
      throw new Error(`Failed to create organization in Zitadel: ${(error as Error).message}`);
    }

    // Step 2: Create in Ontology Service
    try {
      const ontologyResponse = await fetch(`${ONTOLOGY_API_URL}/api/v1/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': input.tenant_id,
        },
        body: JSON.stringify({
          name: input.name,
          slug: input.slug,
          tenant_id: input.tenant_id,
          sso_config: {
            provider: 'zitadel',
            org_id: zitadelOrgId,
            enabled: true,
          },
          settings: input.settings || {},
        }),
      });

      if (!ontologyResponse.ok) {
        const errorText = await ontologyResponse.text();
        // Rollback: Deactivate Zitadel org
        try {
          await zitadelClient.deactivateOrganization(zitadelOrgId);
        } catch {
          console.error('Failed to rollback Zitadel organization');
        }
        throw new Error(`Failed to create organization in Ontology Service: ${errorText}`);
      }

      const ontologyOrg: OntologyOrganization = await ontologyResponse.json();

      // Get the created Zitadel org for complete data
      const zitadelOrg = await zitadelClient.getOrganization(zitadelOrgId);
      if (!zitadelOrg) {
        throw new Error('Failed to retrieve created Zitadel organization');
      }

      return {
        zitadelOrg,
        ontologyOrg,
      };
    } catch (error) {
      if ((error as Error).message.includes('Failed to create organization in Ontology Service')) {
        throw error;
      }
      // Rollback: Deactivate Zitadel org
      try {
        await zitadelClient.deactivateOrganization(zitadelOrgId);
      } catch {
        console.error('Failed to rollback Zitadel organization');
      }
      throw new Error(`Failed to sync organization: ${(error as Error).message}`);
    }
  }

  /**
   * Update organization in both systems
   */
  async updateOrganization(
    ontologyId: string,
    zitadelOrgId: string,
    input: { name: string; settings?: Record<string, unknown> },
    tenantId: string
  ): Promise<void> {
    // Update in Zitadel
    await zitadelClient.updateOrganization(zitadelOrgId, { name: input.name });

    // Update in Ontology Service
    const response = await fetch(`${ONTOLOGY_API_URL}/api/v1/organizations/${ontologyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
      },
      body: JSON.stringify({
        name: input.name,
        settings: input.settings,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update organization in Ontology Service`);
    }
  }

  /**
   * Deactivate organization in both systems
   */
  async deactivateOrganization(
    ontologyId: string,
    zitadelOrgId: string,
    tenantId: string
  ): Promise<void> {
    // Deactivate in Zitadel
    await zitadelClient.deactivateOrganization(zitadelOrgId);

    // Delete/deactivate in Ontology Service
    const response = await fetch(`${ONTOLOGY_API_URL}/api/v1/organizations/${ontologyId}`, {
      method: 'DELETE',
      headers: {
        'X-Tenant-ID': tenantId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to deactivate organization in Ontology Service`);
    }
  }

  /**
   * List organizations from Ontology Service (source of truth for business data)
   */
  async listOrganizations(tenantId: string): Promise<OntologyOrganization[]> {
    const response = await fetch(`${ONTOLOGY_API_URL}/api/v1/organizations`, {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to list organizations');
    }

    return response.json();
  }

  /**
   * Get organization by ID from Ontology Service
   */
  async getOrganization(id: string, tenantId: string): Promise<OntologyOrganization | null> {
    const response = await fetch(`${ONTOLOGY_API_URL}/api/v1/organizations/${id}`, {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get organization');
    }

    return response.json();
  }
}

// Export singleton instance
export const organizationSyncService = new OrganizationSyncService();

// Export types
export type { OntologyOrganization, CreateOrganizationInput, SyncedOrganization };
