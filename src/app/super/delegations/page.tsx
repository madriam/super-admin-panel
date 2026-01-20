'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { organizationsApi } from '@/lib/api/ontology';
import type { OrganizationSummary } from '@/lib/api/types';

// Same mock data as in ai-agents page
const AI_SERVICE_AGENTS = [
  { id: 'ai-service-1', name: 'Assistente de Vendas', model: 'gpt-4o' },
  { id: 'ai-service-2', name: 'Suporte Tecnico', model: 'claude-3-5-sonnet' },
  { id: 'ai-service-3', name: 'FAQ Bot', model: 'gpt-4o-mini' },
  { id: 'ai-service-4', name: 'Agendamento', model: 'claude-3-5-haiku' },
];

export default function DelegationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [delegations, setDelegations] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterPlan, setFilterPlan] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const orgs = await organizationsApi.list({ is_active: true });
      setOrganizations(orgs);

      // Load delegations from localStorage
      const savedDelegations = localStorage.getItem('ai_agent_delegations');
      if (savedDelegations) {
        setDelegations(JSON.parse(savedDelegations));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDelegation = (agentId: string, orgId: string) => {
    const currentOrgIds = delegations[agentId] || [];
    const newOrgIds = currentOrgIds.includes(orgId)
      ? currentOrgIds.filter((id) => id !== orgId)
      : [...currentOrgIds, orgId];

    const newDelegations = { ...delegations, [agentId]: newOrgIds };
    setDelegations(newDelegations);
    localStorage.setItem('ai_agent_delegations', JSON.stringify(newDelegations));
  };

  const filteredOrgs = organizations.filter((org) =>
    filterPlan === 'all' ? true : org.plan === filterPlan
  );

  // Calculate stats
  const stats = {
    totalDelegations: Object.values(delegations).reduce((sum, arr) => sum + arr.length, 0),
    orgsWithAgents: new Set(Object.values(delegations).flat()).size,
    avgAgentsPerOrg:
      organizations.length > 0
        ? (
            Object.values(delegations).reduce((sum, arr) => sum + arr.length, 0) /
            organizations.length
          ).toFixed(1)
        : '0',
  };

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
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matriz de Delegacoes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visao geral de quais agentes AI estao delegados para cada organizacao
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total de Delegacoes</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalDelegations}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Orgs com Agentes</p>
          <p className="text-2xl font-bold text-blue-600">{stats.orgsWithAgents}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Media de Agentes/Org</p>
          <p className="text-2xl font-bold text-green-600">{stats.avgAgentsPerOrg}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm text-gray-600">Filtrar por plano:</span>
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os planos</option>
          <option value="free">Gratuito</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Organizacao
                </th>
                {AI_SERVICE_AGENTS.map((agent) => (
                  <th
                    key={agent.id}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Bot className="h-4 w-4 text-blue-500" />
                      <span className="truncate max-w-[100px]">{agent.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td
                    colSpan={AI_SERVICE_AGENTS.length + 1}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Nenhuma organizacao encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap border-r border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{org.name}</p>
                          <p className="text-xs text-gray-500">{org.plan}</p>
                        </div>
                      </div>
                    </td>
                    {AI_SERVICE_AGENTS.map((agent) => {
                      const isDelegated = delegations[agent.id]?.includes(org.id);
                      return (
                        <td key={agent.id} className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleDelegation(agent.id, org.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDelegated
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title={isDelegated ? 'Remover delegacao' : 'Adicionar delegacao'}
                          >
                            {isDelegated ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <span>Agente delegado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-100 rounded">
            <XCircle className="h-4 w-4 text-gray-400" />
          </div>
          <span>Nao delegado</span>
        </div>
        <p className="text-gray-500">Clique para alternar a delegacao</p>
      </div>
    </div>
  );
}
