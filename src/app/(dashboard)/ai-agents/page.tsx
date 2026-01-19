'use client';

import { useEffect, useState } from 'react';
import { Bot, Save, Info, Zap, MessageSquare, Plus, Trash2, Star, Pencil, Loader2 } from 'lucide-react';
import { aiAgentsApi } from '@/lib/api/ontology';
import { useOrganization } from '@/contexts/organization-context';
import type { AIAgent, AIAgentCreate, AIAgentUpdate, AIModel } from '@/lib/api/types';

const DEFAULT_SYSTEM_PROMPT = `Voce e um assistente virtual prestativo e profissional.
Seu objetivo e ajudar os clientes com suas duvidas e necessidades.
Seja sempre cordial e objetivo em suas respostas.

Se voce nao conseguir ajudar o cliente ou se ele solicitar falar com um atendente humano,
inclua [HANDOFF] em sua resposta para transferir a conversa.`;

export default function AIAgentsPage() {
  const { tenantId } = useOrganization();
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [formData, setFormData] = useState<AIAgentCreate>({
    name: 'Assistente Virtual',
    description: '',
    model: 'gpt-4o-mini',
    system_prompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.7,
    max_tokens: 1000,
    auto_handoff: true,
    max_messages_before_handoff: 50,
    handoff_keywords: ['falar com atendente', 'pessoa real', 'atendimento humano', 'falar com humano'],
    confidence_threshold: 0.7,
    is_active: true,
    is_default: false,
  });
  const [keywordsInput, setKeywordsInput] = useState('');

  useEffect(() => {
    if (tenantId) {
      loadAiAgents();
    }
  }, [tenantId]);

  const loadAiAgents = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const data = await aiAgentsApi.list(tenantId);
      setAiAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agentes AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    setSaving(true);
    try {
      if (editingAgent) {
        await aiAgentsApi.update(tenantId, editingAgent.id, formData as AIAgentUpdate);
      } else {
        await aiAgentsApi.create(tenantId, formData);
      }
      setShowModal(false);
      setEditingAgent(null);
      resetForm();
      loadAiAgents();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar agente AI');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (agent: AIAgent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      model: agent.model,
      system_prompt: agent.system_prompt,
      temperature: agent.temperature,
      max_tokens: agent.max_tokens,
      auto_handoff: agent.auto_handoff,
      max_messages_before_handoff: agent.max_messages_before_handoff,
      handoff_keywords: agent.handoff_keywords,
      confidence_threshold: agent.confidence_threshold,
      is_active: agent.is_active,
      is_default: agent.is_default,
    });
    setKeywordsInput(agent.handoff_keywords.join(', '));
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    if (!confirm('Tem certeza que deseja desativar este agente AI?')) return;

    try {
      await aiAgentsApi.delete(tenantId, id);
      loadAiAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar agente AI');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!tenantId) return;

    try {
      await aiAgentsApi.setDefault(tenantId, id);
      loadAiAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao definir agente padrao');
    }
  };

  const openCreateModal = () => {
    setEditingAgent(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: 'Assistente Virtual',
      description: '',
      model: 'gpt-4o-mini',
      system_prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: 0.7,
      max_tokens: 1000,
      auto_handoff: true,
      max_messages_before_handoff: 50,
      handoff_keywords: ['falar com atendente', 'pessoa real', 'atendimento humano', 'falar com humano'],
      confidence_threshold: 0.7,
      is_active: true,
      is_default: false,
    });
    setKeywordsInput('falar com atendente, pessoa real, atendimento humano, falar com humano');
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agentes AI</h1>
          <p className="text-gray-600 mt-1">Configure os assistentes virtuais</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Novo Agente AI
        </button>
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
            <p className="font-medium">Sobre os Agentes AI</p>
            <p className="mt-1">
              Os agentes AI sao o primeiro ponto de contato com os clientes. Eles respondem mensagens
              automaticamente e podem transferir para um atendente humano quando necessario.
            </p>
          </div>
        </div>
      </div>

      {/* AI Agents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {aiAgents.map((agent) => (
          <div
            key={agent.id}
            className={`bg-white rounded-lg border p-4 ${
              agent.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'
            } ${agent.is_default ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${agent.is_default ? 'bg-blue-100' : 'bg-purple-50'}`}>
                  <Bot className={agent.is_default ? 'text-blue-600' : 'text-purple-600'} size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    {agent.is_default && (
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  {agent.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{agent.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {!agent.is_default && (
                  <button
                    onClick={() => handleSetDefault(agent.id)}
                    className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                    title="Definir como padrao"
                  >
                    <Star size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(agent)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(agent.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Desativar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Settings summary */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Modelo:</span>
                <span className="font-medium text-gray-700">{agent.model}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Auto Handoff:</span>
                <span className={`font-medium ${agent.auto_handoff ? 'text-green-600' : 'text-gray-600'}`}>
                  {agent.auto_handoff ? 'Ativado' : 'Desativado'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Max. Mensagens:</span>
                <span className="font-medium text-gray-700">{agent.max_messages_before_handoff}</span>
              </div>
            </div>

            {/* Status badge */}
            <div className="mt-3">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  agent.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {agent.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {aiAgents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Bot className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agente AI</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece criando o primeiro agente AI para atender seus clientes.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Novo Agente AI
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowModal(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingAgent ? 'Editar Agente AI' : 'Novo Agente AI'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="text-blue-600" size={20} />
                    <h3 className="font-medium text-gray-900">Configuracoes Basicas</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Agente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descricao
                    </label>
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descricao opcional do agente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo de IA
                    </label>
                    <select
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value as AIModel })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="gpt-4o">GPT-4o (Recomendado)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Mais rapido)</option>
                      <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                      <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
                    </select>
                  </div>
                </div>

                {/* System Prompt */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="text-purple-600" size={20} />
                    <h3 className="font-medium text-gray-900">Prompt do Sistema</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instrucoes para o AI *
                    </label>
                    <textarea
                      required
                      value={formData.system_prompt}
                      onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Use [HANDOFF] para indicar quando o AI deve transferir para um humano.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temperatura ({formData.temperature?.toFixed(1)})
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={2}
                        step={0.1}
                        value={formData.temperature}
                        onChange={(e) =>
                          setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Preciso</span>
                        <span>Criativo</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max. Tokens
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={4000}
                        value={formData.max_tokens}
                        onChange={(e) =>
                          setFormData({ ...formData, max_tokens: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Handoff Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="text-orange-600" size={20} />
                    <h3 className="font-medium text-gray-900">Configuracoes de Handoff</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoHandoff"
                      checked={formData.auto_handoff}
                      onChange={(e) => setFormData({ ...formData, auto_handoff: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="autoHandoff" className="text-sm text-gray-700">
                      Habilitar handoff automatico
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximo de mensagens antes do handoff
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={formData.max_messages_before_handoff}
                      onChange={(e) =>
                        setFormData({ ...formData, max_messages_before_handoff: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Palavras-chave para handoff (separadas por virgula)
                    </label>
                    <input
                      type="text"
                      value={keywordsInput}
                      onChange={(e) => {
                        setKeywordsInput(e.target.value);
                        setFormData({
                          ...formData,
                          handoff_keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      O AI transferira automaticamente quando detectar estas frases.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limiar de confianca para handoff ({((formData.confidence_threshold ?? 0.7) * 100).toFixed(0)}%)
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={1}
                      step={0.05}
                      value={formData.confidence_threshold}
                      onChange={(e) =>
                        setFormData({ ...formData, confidence_threshold: parseFloat(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>50% (Mais handoffs)</span>
                      <span>100% (Menos handoffs)</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">
                      Agente ativo
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_default" className="text-sm text-gray-700">
                      Definir como agente padrao
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <Save size={20} />
                    )}
                    {saving ? 'Salvando...' : editingAgent ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
