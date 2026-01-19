'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrganization } from '@/contexts/organization-context';
import { organizationsApi } from '@/lib/api/ontology';
import {
  Network,
  Headphones,
  Plug,
  TrendingUp,
  ArrowRight,
  Building2,
  Loader2,
} from 'lucide-react';

const PLAN_LABELS = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-blue-100 text-blue-800',
  pro: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-amber-100 text-amber-800',
};

interface OrgStats {
  department_count: number;
  agent_count: number;
  messages_used: number;
  messages_limit: number;
  messages_remaining: number;
  usage_percentage: number;
}

export default function DashboardPage() {
  const { selectedOrg } = useOrganization();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedOrg) {
      loadStats();
    }
  }, [selectedOrg]);

  const loadStats = async () => {
    if (!selectedOrg) return;

    try {
      setLoading(true);
      setError(null);
      const data = await organizationsApi.getStats(selectedOrg.id);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatisticas');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedOrg) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedOrg.name}</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{selectedOrg.slug}</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${PLAN_COLORS[selectedOrg.plan]}`}>
                {PLAN_LABELS[selectedOrg.plan]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow px-4 py-5 animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div className="ml-5 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden rounded-lg shadow px-4 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Network className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Departamentos
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats?.department_count ?? selectedOrg.department_count}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden rounded-lg shadow px-4 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Headphones className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Atendentes
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats?.agent_count ?? selectedOrg.agent_count}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden rounded-lg shadow px-4 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Mensagens Usadas
                  </dt>
                  <dd className="flex items-baseline">
                    <span className="text-2xl font-semibold text-gray-900">
                      {(stats?.messages_used ?? selectedOrg.messages_used).toLocaleString()}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      / {(stats?.messages_limit ?? selectedOrg.messages_limit).toLocaleString()}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden rounded-lg shadow px-4 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Plug className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Uso do Plano
                  </dt>
                  <dd className="flex items-baseline">
                    <span className="text-2xl font-semibold text-gray-900">
                      {Math.round(stats?.usage_percentage ?? selectedOrg.usage_percentage)}%
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Progress */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Uso de Mensagens</h3>
          <span className="text-sm text-gray-500">
            {(stats?.messages_remaining ?? selectedOrg.messages_remaining).toLocaleString()} restantes
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${
              (stats?.usage_percentage ?? selectedOrg.usage_percentage) > 90
                ? 'bg-red-500'
                : (stats?.usage_percentage ?? selectedOrg.usage_percentage) > 70
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, stats?.usage_percentage ?? selectedOrg.usage_percentage)}%` }}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Acesso Rapido</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/departments"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Network className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Departamentos</p>
                <p className="text-sm text-gray-500">Gerenciar estrutura</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </Link>

          <Link
            href="/agents"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Atendentes</p>
                <p className="text-sm text-gray-500">Gerenciar equipe</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </Link>

          <Link
            href="/integrations"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Plug className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Integracoes</p>
                <p className="text-sm text-gray-500">Canais de entrada</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
