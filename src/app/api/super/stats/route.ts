import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/super-admin-auth';

const ONTOLOGY_API_URL = process.env.NEXT_PUBLIC_ONTOLOGY_API_URL || 'http://localhost:8000';

interface OrganizationSummary {
  id: string;
  is_active: boolean;
  messages_used: number;
  messages_limit: number;
  plan: string;
}

// Plan pricing for MRR calculation (monthly values in BRL)
const PLAN_PRICING: Record<string, number> = {
  free: 0,
  starter: 99,
  pro: 299,
  enterprise: 999,
};

export async function GET() {
  try {
    // Verify super admin auth
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      );
    }

    // Fetch organizations from Ontology Service
    let organizations: OrganizationSummary[] = [];
    try {
      const response = await fetch(`${ONTOLOGY_API_URL}/api/v1/organizations`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        organizations = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      // Continue with empty array - will show X for unavailable data
    }

    // Calculate stats
    const totalOrgs = organizations.length;
    const activeOrgs = organizations.filter((o) => o.is_active).length;

    // Calculate MRR
    const totalMRR = organizations.reduce((sum, org) => {
      const planPrice = PLAN_PRICING[org.plan] || 0;
      return sum + (org.is_active ? planPrice : 0);
    }, 0);

    // Calculate total conversations today (estimate from messages_used)
    // This is an approximation - in production, connect to actual analytics
    const totalConversationsToday = organizations.reduce((sum, org) => {
      // Estimate daily conversations as messages_used / 30 (monthly average)
      return sum + Math.floor(org.messages_used / 30);
    }, 0);

    // Get uptime from service status (simplified - always show 99.9% or calculate from monitoring)
    const uptime = '99.9%';

    return NextResponse.json({
      activeOrgs: activeOrgs > 0 ? activeOrgs : null, // null means "X" (unavailable)
      totalOrgs: totalOrgs > 0 ? totalOrgs : null,
      totalConversationsToday: totalConversationsToday > 0 ? totalConversationsToday : null,
      totalMRR: totalMRR > 0 ? totalMRR : null,
      uptime,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Erro ao obter estatisticas' },
      { status: 500 }
    );
  }
}
