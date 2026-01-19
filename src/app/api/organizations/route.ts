import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { organizationSyncService } from '@/services/organization-sync';

/**
 * POST /api/organizations - Create organization (synced to Zitadel + Ontology)
 *
 * Requires super_admin role
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check super_admin role
  const roles = session.user.roles || [];
  if (!roles.includes('super_admin')) {
    return NextResponse.json(
      { error: 'Forbidden: super_admin role required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, slug, tenant_id, admin, settings } = body;

    // Validate required fields
    if (!name || !slug || !tenant_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, tenant_id' },
        { status: 400 }
      );
    }

    // Create organization in both systems
    const result = await organizationSyncService.createOrganization({
      name,
      slug,
      tenant_id,
      admin,
      settings,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizations - List organizations
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = request.nextUrl.searchParams.get('tenant_id') || 'tenant-a';

  try {
    const organizations = await organizationSyncService.listOrganizations(tenantId);
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Failed to list organizations:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
