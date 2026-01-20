'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Share2,
  Building2,
  CheckCircle,
  XCircle,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { aiAgentsApi, organizationsApi } from '@/lib/api/ontology';
import type { AIAgent, AIAgentCreate, AIAgentUpdate, OrganizationSummary } from '@/lib/api/types';

const MODEL_INFO = {
  'gpt-4o': { name: 'GPT-4o', color: 'bg-green-100 text-green-800', provider: 'OpenAI' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', color: 'bg-green-50 text-green-700', provider: 'OpenAI' },
  'claude-3-5-sonnet': { name: 'Claude 3.5 Sonnet', color: 'bg-purple-100 text-purple-800', provider: 'Anthropic' },
  'claude-3-5-haiku': { name: 'Claude 3.5 Haiku', color: 'bg-purple-50 text-purple-700', provider: 'Anthropic' },
};

// Mock AI Service agents (these would come from a central AI Service in production)
const AI_SERVICE_AGENTS = [
  {
    id: 'ai-service-1',
    name: 'Assistente de Vendas',
    description: 'Especialista em vendas e conversao de leads',
    model: 'gpt-4o' as const,
    capabilities: ['vendas', 'qualificacao', 'follow-up'],
  },
  {
    id: 'ai-service-2',
    name: 'Suporte Tecnico',
    description: 'Atendimento de suporte tecnico e resolucao de problemas',
    model: 'claude-3-5-sonnet' as const,
    capabilities: ['troubleshooting', 'documentacao', 'escalonamento'],
  },
  {
    id: 'ai-service-3',
    name: 'FAQ Bot',
    description: 'Responde perguntas frequentes de forma automatizada',
    model: 'gpt-4o-mini' as const,
    capabilities: ['faq', 'autoatendimento', 'triagem'],
  },
  {
    id: 'ai-service-4',
    name: 'Agendamento',
    description: 'Gerencia agendamentos e reservas',
    model: 'claude-3-5-haiku' as const,
    capabilities: ['calendario', 'confirmacao', 'lembretes'],
  },
];

interface DelegationModalProps {
  agent: typeof AI_SERVICE_AGENTS[0];
  organizations: OrganizationSummary[];
  delegations: Record<string, string[]>;
  onSave: (agentId: string, orgIds: string[]) => void;
  onClose: () => void;
}

function DelegationModal({ agent, organizations, delegations, onSave, onClose }: DelegationModalProps) {
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>(delegations[agent.id] || []);
  const [saving, setSaving] = useState(false);

  const toggleOrg = (orgId: string) => {
    setSelectedOrgs((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(agent.id, selectedOrgs);
    setSaving(false);
    onClose();
  };

  const modelInfo = MODEL_INFO[agent.model];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{agent.name}</h2>
              <p className="text-sm text-gray-500">{agent.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Cpu className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Modelo:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${modelInfo.color}`}>
              {modelInfo.name}
            </span>
            <span className="text-gray-400">({modelInfo.provider})</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-2">
            <Sparkles className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Capacidades:</span>
            <div className="flex gap-1">
              {agent.capabilities.map((cap) => (
                <span key={cap} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-2">
            Delegar para organizacoes ({selectedOrgs.length} selecionadas)
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Selecione as organizacoes que poderao usar este agente AI.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
          {organizations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma organizacao ativa encontrada.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {organizations.map((org) => {
                const isSelected = selectedOrgs.includes(org.id);
                return (
                  <div
                    key={org.id}
                    onClick={() => toggleOrg(org.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{org.name}</p>
                      <p className="text-xs text-gray-500">{org.slug}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        org.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {org.plan}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {selectedOrgs.length} de {organizations.length} organizacoes selecionadas
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="animate-spin h-4 w-4" />}
              Salvar Delegacoes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminAIAgentsPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [delegations, setDelegations] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<typeof AI_SERVICE_AGENTS[0] | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const orgs = await organizationsApi.list({ is_active: true });
      setOrganizations(orgs);

      // Load delegations from localStorage (in production, this would come from an API)
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

  const handleSaveDelegations = async (agentId: string, orgIds: string[]) => {
    const newDelegations = { ...delegations, [agentId]: orgIds };
    setDelegations(newDelegations);
    // In production, this would be an API call
    localStorage.setItem('ai_agent_delegations', JSON.stringify(newDelegations));
  };

  const filteredAgents = AI_SERVICE_AGENTS.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os agentes AI disponiveis no AI Service e delegue para organizacoes
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Sobre os AI Agents</h3>
            <p className="text-sm text-blue-700 mt-1">
              Os agentes AI sao configurados centralmente no AI Service e podem ser delegados para
              as organizacoes clientes. Cada organizacao pode configurar parametros especificos
              como tom de voz, horarios de atendimento e prompts personalizados.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar agentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => {
          const modelInfo = MODEL_INFO[agent.model];
          const delegatedCount = delegations[agent.id]?.length || 0;

          return (
            <div
              key={agent.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${modelInfo.color}`}>
                  {modelInfo.name}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">{agent.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{agent.description}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {cap}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{delegatedCount} orgs</span>
                </div>
                <button
                  onClick={() => setSelectedAgent(agent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Share2 size={16} />
                  Delegar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-12 text-center">
          <Bot className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agente encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Tente ajustar a busca.</p>
        </div>
      )}

      {/* Delegation Modal */}
      {selectedAgent && (
        <DelegationModal
          agent={selectedAgent}
          organizations={organizations}
          delegations={delegations}
          onSave={handleSaveDelegations}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
