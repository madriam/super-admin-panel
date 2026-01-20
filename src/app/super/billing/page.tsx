'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { organizationsApi } from '@/lib/api/ontology';
import type { OrganizationSummary } from '@/lib/api/types';

const PLAN_PRICING = {
  free: { price: 0, messages: 1000 },
  starter: { price: 99, messages: 5000 },
  pro: { price: 299, messages: 20000 },
  enterprise: { price: 999, messages: 100000 },
};

const PLAN_LABELS = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export default function BillingPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const orgs = await organizationsApi.list({});
      setOrganizations(orgs);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate billing stats
  const stats = {
    totalMRR: organizations.reduce(
      (sum, org) => sum + (PLAN_PRICING[org.plan]?.price || 0),
      0
    ),
    paidOrgs: organizations.filter((o) => o.plan !== 'free').length,
    freeOrgs: organizations.filter((o) => o.plan === 'free').length,
    totalMessages: organizations.reduce((sum, o) => sum + o.messages_used, 0),
    byPlan: {
      free: organizations.filter((o) => o.plan === 'free').length,
      starter: organizations.filter((o) => o.plan === 'starter').length,
      pro: organizations.filter((o) => o.plan === 'pro').length,
      enterprise: organizations.filter((o) => o.plan === 'enterprise').length,
    },
  };

  // Find orgs approaching limit (>80% usage)
  const approachingLimit = organizations.filter((org) => {
    const usage = org.messages_limit > 0 ? (org.messages_used / org.messages_limit) * 100 : 0;
    return usage >= 80 && org.is_active;
  });

  if (loading) {
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
        <h1 className="text-2xl font-bold text-gray-900">Planos e Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visao geral de receita e uso de recursos por organizacao
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">MRR Total</p>
              <p className="text-3xl font-bold text-gray-900">
                R$ {stats.totalMRR.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+12% vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Orgs Pagantes</p>
              <p className="text-3xl font-bold text-blue-600">{stats.paidOrgs}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {stats.freeOrgs} no plano gratuito
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Mensagens/Mes</p>
              <p className="text-3xl font-bold text-purple-600">
                {(stats.totalMessages / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">Total processadas</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Proximo Fechamento</p>
              <p className="text-3xl font-bold text-gray-900">01/02</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">em 11 dias</p>
        </div>
      </div>

      {/* Alerts */}
      {approachingLimit.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">
                {approachingLimit.length} organizacao(oes) se aproximando do limite
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Considere entrar em contato para upgrade de plano:{' '}
                {approachingLimit.map((o) => o.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuicao por Plano
          </h2>
          <div className="space-y-4">
            {Object.entries(PLAN_PRICING).map(([plan, { price, messages }]) => {
              const count = stats.byPlan[plan as keyof typeof stats.byPlan];
              const percentage =
                organizations.length > 0
                  ? ((count / organizations.length) * 100).toFixed(0)
                  : 0;

              return (
                <div key={plan} className="flex items-center gap-4">
                  <div className="w-24">
                    <span className="text-sm font-medium text-gray-900">
                      {PLAN_LABELS[plan as keyof typeof PLAN_LABELS]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          plan === 'enterprise'
                            ? 'bg-amber-500'
                            : plan === 'pro'
                            ? 'bg-purple-500'
                            : plan === 'starter'
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                    <span className="text-sm text-gray-500 ml-1">({percentage}%)</span>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-sm text-gray-500">
                      R$ {(count * price).toLocaleString()}/mes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tabela de Precos</h2>
          <div className="space-y-3">
            {Object.entries(PLAN_PRICING).map(([plan, { price, messages }]) => (
              <div
                key={plan}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {PLAN_LABELS[plan as keyof typeof PLAN_LABELS]}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ate {messages.toLocaleString()} msg/mes
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  {price === 0 ? 'Gratis' : `R$ ${price}/mes`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Usage Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Uso Detalhado por Organizacao
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Organizacao
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Uso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {organizations.map((org) => {
                const usage =
                  org.messages_limit > 0
                    ? Math.round((org.messages_used / org.messages_limit) * 100)
                    : 0;
                const price = PLAN_PRICING[org.plan]?.price || 0;

                return (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-xs text-gray-500">{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          org.plan === 'enterprise'
                            ? 'bg-amber-100 text-amber-800'
                            : org.plan === 'pro'
                            ? 'bg-purple-100 text-purple-800'
                            : org.plan === 'starter'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {PLAN_LABELS[org.plan]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {price === 0 ? 'Gratis' : `R$ ${price}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              usage >= 90
                                ? 'bg-red-500'
                                : usage >= 70
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, usage)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{usage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {org.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                        Ver detalhes
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
