import { NextResponse } from 'next/server';

export interface ServiceStatus {
  name: string;
  status: 'ok' | 'error' | 'unknown';
  latency?: number;
  lastChecked: string;
}

// Service endpoints to check
const SERVICES = [
  {
    name: 'API Gateway',
    url: process.env.WHATSAPP_GATEWAY_URL || 'https://whatsapp.ilhaperdida.com.br/health',
  },
  {
    name: 'Ontology Service',
    url: process.env.ONTOLOGY_API_URL || process.env.NEXT_PUBLIC_ONTOLOGY_API_URL || 'https://ontology.ilhaperdida.com.br/health',
  },
  {
    name: 'Vault',
    url: process.env.VAULT_URL || 'https://caverna.ilhaperdida.com.br/v1/sys/health',
  },
  {
    name: 'ArgoCD',
    // ArgoCD redirects /api/version, so just check base URL returns something
    url: process.env.ARGOCD_URL || 'https://argocd.ilhaperdida.com.br/',
  },
  {
    name: 'Zitadel',
    url: process.env.ZITADEL_ISSUER ? `${process.env.ZITADEL_ISSUER}/.well-known/openid-configuration` : 'https://auth.ilhaperdida.com.br/.well-known/openid-configuration',
  },
];

async function checkServiceHealth(
  name: string,
  url: string
): Promise<ServiceStatus> {
  const now = new Date().toISOString();

  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'manual', // Don't follow redirects - just check if service responds
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    // Consider 2xx, 3xx (redirects), and some 4xx as "ok" (service is responding)
    const isOk = response.status >= 200 && response.status < 500;

    return {
      name,
      status: isOk ? 'ok' : 'error',
      latency,
      lastChecked: now,
    };
  } catch {
    return {
      name,
      status: 'error',
      lastChecked: now,
    };
  }
}

export async function GET() {
  try {
    // Check all services in parallel
    const statusPromises = SERVICES.map((service) =>
      checkServiceHealth(service.name, service.url)
    );

    const statuses = await Promise.all(statusPromises);

    // Calculate overall status
    const errorCount = statuses.filter((s) => s.status === 'error').length;
    const unknownCount = statuses.filter((s) => s.status === 'unknown').length;
    const okCount = statuses.filter((s) => s.status === 'ok').length;

    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (errorCount > 0) {
      overallStatus = errorCount >= 3 ? 'critical' : 'degraded';
    }

    return NextResponse.json({
      overall: overallStatus,
      services: statuses,
      summary: {
        ok: okCount,
        error: errorCount,
        unknown: unknownCount,
        total: statuses.length,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Service status check error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status dos servicos' },
      { status: 500 }
    );
  }
}
