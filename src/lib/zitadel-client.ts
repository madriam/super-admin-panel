/**
 * Zitadel Management API Client
 *
 * This client handles organization management in Zitadel using the Management API.
 * It requires a service account with appropriate permissions.
 *
 * Environment Variables:
 * - ZITADEL_ISSUER: https://auth.ilhaperdida.com.br
 * - ZITADEL_SERVICE_USER_ID: Service account user ID
 * - ZITADEL_PRIVATE_KEY: Service account private key (JWT signing)
 */

import { SignJWT, importPKCS8 } from 'jose';

const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER || 'https://auth.ilhaperdida.com.br';
const SERVICE_USER_ID = process.env.ZITADEL_SERVICE_USER_ID;
const PRIVATE_KEY = process.env.ZITADEL_PRIVATE_KEY;

interface ZitadelOrganization {
  id: string;
  name: string;
  state: string;
  primaryDomain: string;
}

interface CreateOrganizationRequest {
  name: string;
  admins?: Array<{
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
  }>;
}

interface CreateOrganizationResponse {
  organizationId: string;
  details: {
    sequence: string;
    creationDate: string;
  };
}

class ZitadelClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Generate a JWT for service account authentication
   */
  private async generateServiceToken(): Promise<string> {
    if (!SERVICE_USER_ID || !PRIVATE_KEY) {
      throw new Error('ZITADEL_SERVICE_USER_ID and ZITADEL_PRIVATE_KEY are required');
    }

    const privateKey = await importPKCS8(PRIVATE_KEY, 'RS256');

    const now = Math.floor(Date.now() / 1000);
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: SERVICE_USER_ID })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600) // 1 hour
      .setIssuer(SERVICE_USER_ID)
      .setSubject(SERVICE_USER_ID)
      .setAudience(ZITADEL_ISSUER)
      .sign(privateKey);

    return jwt;
  }

  /**
   * Get a valid access token (generate new if expired)
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry > now + 300000) {
      return this.accessToken;
    }

    // Generate new JWT assertion
    const assertion = await this.generateServiceToken();

    // Exchange JWT for access token
    const response = await fetch(`${ZITADEL_ISSUER}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        scope: 'openid urn:zitadel:iam:org:project:id:zitadel:aud',
        assertion,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Zitadel access token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = now + data.expires_in * 1000;

    return this.accessToken!;
  }

  /**
   * Make an authenticated request to Zitadel API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${ZITADEL_ISSUER}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Zitadel API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Create a new organization in Zitadel
   */
  async createOrganization(data: CreateOrganizationRequest): Promise<CreateOrganizationResponse> {
    // Create the organization
    const createResponse = await this.request<CreateOrganizationResponse>(
      '/management/v1/orgs/_setup',
      {
        method: 'POST',
        body: JSON.stringify({
          org: {
            name: data.name,
          },
          humanUser: data.admins?.[0]
            ? {
                email: { email: data.admins[0].email },
                profile: {
                  firstName: data.admins[0].firstName,
                  lastName: data.admins[0].lastName,
                },
                userName: data.admins[0].userName,
                password: data.admins[0].password
                  ? { password: data.admins[0].password }
                  : undefined,
              }
            : undefined,
        }),
      }
    );

    return createResponse;
  }

  /**
   * Get organization by ID
   */
  async getOrganization(orgId: string): Promise<ZitadelOrganization | null> {
    try {
      const response = await this.request<{ org: ZitadelOrganization }>(
        `/management/v1/orgs/${orgId}`
      );
      return response.org;
    } catch (error) {
      if ((error as Error).message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all organizations
   */
  async listOrganizations(): Promise<ZitadelOrganization[]> {
    const response = await this.request<{ result: ZitadelOrganization[] }>(
      '/admin/v1/orgs/_search',
      {
        method: 'POST',
        body: JSON.stringify({
          query: { limit: 100 },
        }),
      }
    );
    return response.result || [];
  }

  /**
   * Update organization
   */
  async updateOrganization(
    orgId: string,
    data: { name: string }
  ): Promise<void> {
    await this.request(`/management/v1/orgs/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Deactivate organization
   */
  async deactivateOrganization(orgId: string): Promise<void> {
    await this.request(`/management/v1/orgs/${orgId}/_deactivate`, {
      method: 'POST',
    });
  }

  /**
   * Add user to organization with role
   */
  async addUserToOrganization(
    orgId: string,
    userId: string,
    roles: string[]
  ): Promise<void> {
    await this.request(`/management/v1/orgs/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        roles,
      }),
    });
  }
}

// Export singleton instance
export const zitadelClient = new ZitadelClient();

// Export types
export type { ZitadelOrganization, CreateOrganizationRequest, CreateOrganizationResponse };
