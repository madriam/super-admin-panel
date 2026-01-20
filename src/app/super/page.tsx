'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  MessageSquare,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { organizationsApi } from '@/lib/api/ontology';
import type { OrganizationSummary } from '@/lib/api/types';
import { ServiceStatusWidget } from '@/components/super-admin/service-status-widget';

interface PlatformStats {
  activeOrgs: number | null;
  totalOrgs: number | null;
  totalConversationsToday: number | null;
  totalMRR: number | null;
  uptime: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
}: {
  title: string;
  value: string | number | null;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'indigo' | 'green' | 'yellow' | 'red' | 'purple' | 'blue';
}) {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  // Display "X" for unavailable data
  const displayValue = value === null ? 'X' : value;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{displayValue}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function OrgStatusCard({ org }: { org: OrganizationSummary }) {
  const usagePercent = org.messages_limit > 0
    ? Math.round((org.messages_used / org.messages_limit) * 100)
    : 0;

  const getStatusColor = () => {
    if (!org.is_active) return 'bg-gray-100 text-gray-600';
    if (usagePercent >= 90) return 'bg-red-100 text-red-600';
    if (usagePercent >= 70) return 'bg-yellow-100 text-yellow-600';
    return 'bg-green-100 text-green-600';
  };

  const getStatusIcon = () => {
    if (!org.is_active) return Clock;
    if (usagePercent >= 90) return AlertTriangle;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  // Generate org panel URL
  const orgPanelUrl = `https://${org.slug}.panel.ilhaperdida.com.br`;

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{org.name}</h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}
            >
              <StatusIcon className="h-3 w-3" />
              {!org.is_active ? 'Inativo' : usagePercent >= 90 ? 'Limite' : 'Ativo'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{org.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded">
            {org.plan}
          </span>
          <a
            href={orgPanelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
            title={`Abrir painel: ${orgPanelUrl}`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Uso de mensagens</span>
          <span className="font-medium">{usagePercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {org.messages_used.toLocaleString('pt-BR')} / {org.messages_limit.toLocaleString('pt-BR')} mensagens
        </p>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch stats from our API
        const statsResponse = await fetch('/api/super/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch organizations
        const orgs = await organizationsApi.list({});
        setOrganizations(orgs);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Set default stats with null values (will show "X")
        setStats({
          activeOrgs: null,
          totalOrgs: null,
          totalConversationsToday: null,
          totalMRR: null,
          uptime: '99.9%',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Highlight organizations that need attention
  const criticalOrgs = organizations.filter((o) => {
    const usage = o.messages_limit > 0 ? (o.messages_used / o.messages_limit) * 100 : 0;
    return o.is_active && usage >= 80;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Global</h1>
        <p className="mt-1 text-gray-500">
          Visao geral de todas as organizacoes da plataforma
        </p>
      </div>

      {/* Stats Grid - 4 StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Orgs Ativas"
          value={stats?.activeOrgs ?? null}
          subtitle={stats?.totalOrgs != null ? `${stats.totalOrgs} total` : undefined}
          icon={Building2}
          color="indigo"
        />
        <StatCard
          title="Conversas (hoje)"
          value={stats?.totalConversationsToday ?? null}
          subtitle="Estimativa diaria"
          icon={MessageSquare}
          color="purple"
        />
        <StatCard
          title="MRR"
          value={stats?.totalMRR != null ? `R$ ${stats.totalMRR.toLocaleString('pt-BR')}` : null}
          subtitle="Receita mensal"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Uptime"
          value={stats?.uptime ?? 'X'}
          subtitle="Ultimo mes"
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Service Status Widget */}
      <ServiceStatusWidget />

      {/* Critical Alerts */}
      {criticalOrgs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">
              {criticalOrgs.length} organizacao(oes) com uso elevado
            </h3>
          </div>
          <p className="mt-1 text-sm text-yellow-700">
            As seguintes organizacoes estao com 80% ou mais do limite de mensagens:{' '}
            {criticalOrgs.map((o) => o.name).join(', ')}
          </p>
        </div>
      )}

      {/* Organizations Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Organizacoes ({organizations.length})
          </h2>
          <a
            href="/super/organizations"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Ver todas →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.slice(0, 6).map((org) => (
            <OrgStatusCard key={org.id} org={org} />
          ))}
        </div>
        {organizations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma organizacao cadastrada
          </div>
        )}
      </div>
    </div>
  );
}
