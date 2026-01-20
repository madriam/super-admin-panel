'use client';

import { useEffect, useState } from 'react';
import { Bot, Save, Info, Zap, MessageSquare, Pencil, Loader2, Lock, Cpu, Clock, Sparkles } from 'lucide-react';
import { aiAgentsApi } from '@/lib/api/ontology';
import { useOrganization } from '@/contexts/organization-context';
import type { AIAgent, AIAgentUpdate, AIModel } from '@/lib/api/types';

// Mock delegated agents from AI Service (in production, this comes from API based on org's delegations)
const AI_SERVICE_AGENTS = [
  {
    id: 'ai-service-1',
    name: 'Assistente de Vendas',
    description: 'Especialista em vendas e conversao de leads',
    model: 'gpt-4o' as AIModel,
    capabilities: ['vendas', 'qualificacao', 'follow-up'],
    basePrompt: 'Voce e um assistente especializado em vendas...',
  },
  {
    id: 'ai-service-3',
    name: 'FAQ Bot',
    description: 'Responde perguntas frequentes de forma automatizada',
    model: 'gpt-4o-mini' as AIModel,
    capabilities: ['faq', 'autoatendimento', 'triagem'],
    basePrompt: 'Voce e um assistente que responde perguntas frequentes...',
  },
];

interface OrgAgentConfig {
  serviceAgentId: string;
  customPromptSuffix: string;
  temperature: number;
  maxTokens: number;
  autoHandoff: boolean;
  maxMessagesBeforeHandoff: number;
  handoffKeywords: string[];
  workingHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  isActive: boolean;
}

const DEFAULT_CONFIG: Omit<OrgAgentConfig, 'serviceAgentId'> = {
  customPromptSuffix: '',
  temperature: 0.7,
  maxTokens: 1000,
  autoHandoff: true,
  maxMessagesBeforeHandoff: 50,
  handoffKeywords: ['falar com atendente', 'pessoa real', 'atendimento humano'],
  workingHours: {
    enabled: false,
    start: '08:00',
    end: '18:00',
    timezone: 'America/Sao_Paulo',
  },
  isActive: true,
};

export default function OrgAdminAIAgentsPage() {
  const { tenantId, selectedOrg } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [delegatedAgents, setDelegatedAgents] = useState<typeof AI_SERVICE_AGENTS>([]);
  const [agentConfigs, setAgentConfigs] = useState<Record<string, OrgAgentConfig>>({});
  const [editingAgent, setEditingAgent] = useState<typeof AI_SERVICE_AGENTS[0] | null>(null);
  const [editConfig, setEditConfig] = useState<OrgAgentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState('');

  useEffect(() => {
    if (tenantId) {
      loadDelegatedAgents();
    }
  }, [tenantId]);

  const loadDelegatedAgents = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);

      // In production, this would check delegations from the API
      // For now, we check localStorage for delegations set by super admin
      const savedDelegations = localStorage.getItem('ai_agent_delegations');
      const delegations: Record<string, string[]> = savedDelegations
        ? JSON.parse(savedDelegations)
        : {};

      // Get org ID from selected org or use a default for demo
      const orgId = selectedOrg?.id || 'demo-org';

      // Filter to only show delegated agents for this org
      const delegatedIds = new Set(
        Object.entries(delegations)
          .filter(([_, orgIds]) => orgIds.includes(orgId))
          .map(([agentId]) => agentId)
      );

      // If no delegations found, show all for demo purposes
      const agents = delegatedIds.size > 0
        ? AI_SERVICE_AGENTS.filter(a => delegatedIds.has(a.id))
        : AI_SERVICE_AGENTS;

      setDelegatedAgents(agents);

      // Load saved configurations
      const savedConfigs = localStorage.getItem(`org_agent_configs_${tenantId}`);
      if (savedConfigs) {
        setAgentConfigs(JSON.parse(savedConfigs));
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agentes AI');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAgent = (agent: typeof AI_SERVICE_AGENTS[0]) => {
    setEditingAgent(agent);
    const existingConfig = agentConfigs[agent.id] || {
      serviceAgentId: agent.id,
      ...DEFAULT_CONFIG,
    };
    setEditConfig(existingConfig);
    setKeywordsInput(existingConfig.handoffKeywords.join(', '));
  };

  const handleSaveConfig = async () => {
    if (!editingAgent || !editConfig || !tenantId) return;

    setSaving(true);
    try {
      const newConfigs = {
        ...agentConfigs,
        [editingAgent.id]: editConfig,
      };
      setAgentConfigs(newConfigs);
      localStorage.setItem(`org_agent_configs_${tenantId}`, JSON.stringify(newConfigs));

      setEditingAgent(null);
      setEditConfig(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuracao');
    } finally {
      setSaving(false);
    }
  };

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agentes AI</h1>
        <p className="text-gray-600 mt-1">Configure os assistentes virtuais disponiveis para sua organizacao</p>
      </div>

      {/* Success message */}
      {saved && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          Configuracoes salvas com sucesso!
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <Info className="text-blue-600 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Sobre os Agentes AI Delegados</p>
            <p className="mt-1">
              Os agentes AI abaixo foram habilitados para sua organizacao pelo administrador da plataforma.
              Voce pode personalizar o comportamento de cada agente para atender suas necessidades,
              incluindo tom de voz, horarios de atendimento e regras de handoff.
            </p>
          </div>
        </div>
      </div>

      {/* AI Agents Grid */}
      {delegatedAgents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Lock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agente AI disponivel</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            Nenhum agente AI foi delegado para sua organizacao ainda.
            Entre em contato com o administrador da plataforma para solicitar acesso.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {delegatedAgents.map((agent) => {
            const config = agentConfigs[agent.id];
            const isConfigured = !!config;

            return (
              <div
                key={agent.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Bot className="text-blue-600" size={28} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditAgent(agent)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Configurar"
                    >
                      <Pencil size={20} />
                    </button>
                  </div>

                  {/* Capabilities */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {agent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  {/* Status and Model Info */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Modelo:</span>
                      <span className="font-medium text-gray-900">{agent.model}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Status:</span>
                      {config?.isActive !== false ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Configuration Summary */}
                  {isConfigured && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {config.workingHours.enabled
                            ? `Horario: ${config.workingHours.start} - ${config.workingHours.end}`
                            : '24 horas'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Zap className="h-4 w-4" />
                        <span>
                          Handoff: {config.autoHandoff ? `Ativo (max ${config.maxMessagesBeforeHandoff} msgs)` : 'Manual'}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isConfigured && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                      Este agente esta usando as configuracoes padrao. Clique em configurar para personalizar.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configuration Modal */}
      {editingAgent && editConfig && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setEditingAgent(null)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bot className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Configurar {editingAgent.name}
                  </h2>
                  <p className="text-sm text-gray-500">{editingAgent.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Custom Prompt Suffix */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="text-purple-600" size={18} />
                    <label className="font-medium text-gray-900">Personalizacao do Prompt</label>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Adicione instrucoes especificas para sua organizacao (ex: tom de voz, informacoes sobre sua empresa)
                  </p>
                  <textarea
                    value={editConfig.customPromptSuffix}
                    onChange={(e) => setEditConfig({ ...editConfig, customPromptSuffix: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Sempre mencione que somos a Auto Pecas Silva, com mais de 20 anos de experiencia..."
                  />
                </div>

                {/* Working Hours */}
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="text-blue-600" size={18} />
                    <label className="font-medium text-gray-900">Horario de Atendimento</label>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="workingHoursEnabled"
                      checked={editConfig.workingHours.enabled}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          workingHours: { ...editConfig.workingHours, enabled: e.target.checked },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="workingHoursEnabled" className="text-sm text-gray-700">
                      Restringir horario de atendimento do AI
                    </label>
                  </div>
                  {editConfig.workingHours.enabled && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Inicio</label>
                        <input
                          type="time"
                          value={editConfig.workingHours.start}
                          onChange={(e) =>
                            setEditConfig({
                              ...editConfig,
                              workingHours: { ...editConfig.workingHours, start: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fim</label>
                        <input
                          type="time"
                          value={editConfig.workingHours.end}
                          onChange={(e) =>
                            setEditConfig({
                              ...editConfig,
                              workingHours: { ...editConfig.workingHours, end: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Handoff Settings */}
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-orange-600" size={18} />
                    <label className="font-medium text-gray-900">Configuracoes de Handoff</label>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="autoHandoff"
                      checked={editConfig.autoHandoff}
                      onChange={(e) => setEditConfig({ ...editConfig, autoHandoff: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="autoHandoff" className="text-sm text-gray-700">
                      Habilitar handoff automatico para atendente humano
                    </label>
                  </div>

                  {editConfig.autoHandoff && (
                    <div className="space-y-4 pl-6">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Maximo de mensagens antes do handoff
                        </label>
                        <input
                          type="number"
                          min={10}
                          max={200}
                          value={editConfig.maxMessagesBeforeHandoff}
                          onChange={(e) =>
                            setEditConfig({
                              ...editConfig,
                              maxMessagesBeforeHandoff: parseInt(e.target.value),
                            })
                          }
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Palavras-chave para handoff (separadas por virgula)
                        </label>
                        <input
                          type="text"
                          value={keywordsInput}
                          onChange={(e) => {
                            setKeywordsInput(e.target.value);
                            setEditConfig({
                              ...editConfig,
                              handoffKeywords: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="falar com atendente, pessoa real, ..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Parameters */}
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu className="text-green-600" size={18} />
                    <label className="font-medium text-gray-900">Parametros do AI</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Temperatura ({editConfig.temperature.toFixed(1)})
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={2}
                        step={0.1}
                        value={editConfig.temperature}
                        onChange={(e) =>
                          setEditConfig({ ...editConfig, temperature: parseFloat(e.target.value) })
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Preciso</span>
                        <span>Criativo</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max. Tokens</label>
                      <input
                        type="number"
                        min={100}
                        max={4000}
                        value={editConfig.maxTokens}
                        onChange={(e) =>
                          setEditConfig({ ...editConfig, maxTokens: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Status */}
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editConfig.isActive}
                      onChange={(e) => setEditConfig({ ...editConfig, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Agente ativo (desmarque para desabilitar temporariamente)
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setEditingAgent(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <Save size={20} />
                  )}
                  {saving ? 'Salvando...' : 'Salvar Configuracao'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
