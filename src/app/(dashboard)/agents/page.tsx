'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Headphones, Circle } from 'lucide-react';
import { agentsApi, departmentsApi } from '@/lib/api/ontology';
import type { Agent, AgentCreate, AgentUpdate, AgentStatus, Department } from '@/lib/api/types';

const statusConfig: Record<AgentStatus, { label: string; color: string; bgColor: string }> = {
  online: { label: 'Online', color: 'text-green-600', bgColor: 'bg-green-100' },
  offline: { label: 'Offline', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  busy: { label: 'Ocupado', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  away: { label: 'Ausente', color: 'text-orange-600', bgColor: 'bg-orange-100' },
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Filters
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<AgentCreate>({
    name: '',
    email: '',
    department_id: null,
    external_id: '',
    skills: [],
    max_concurrent_chats: 5,
    is_active: true,
  });
  const [skillsInput, setSkillsInput] = useState('');

  useEffect(() => {
    loadData();
  }, [filterDepartment, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agentsData, deptsData] = await Promise.all([
        agentsApi.list({
          department_id: filterDepartment || undefined,
          status_filter: filterStatus || undefined,
        }),
        departmentsApi.list(),
      ]);
      setAgents(agentsData);
      setDepartments(deptsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (editingAgent) {
        await agentsApi.update(editingAgent.id, data as AgentUpdate);
      } else {
        await agentsApi.create(data);
      }
      setShowModal(false);
      setEditingAgent(null);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar atendente');
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email || '',
      department_id: agent.department_id,
      external_id: agent.external_id || '',
      skills: agent.skills,
      max_concurrent_chats: agent.max_concurrent_chats,
      is_active: agent.is_active,
    });
    setSkillsInput(agent.skills.join(', '));
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar este atendente?')) return;
    try {
      await agentsApi.delete(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar atendente');
    }
  };

  const handleStatusChange = async (agent: Agent, newStatus: AgentStatus) => {
    try {
      await agentsApi.updateStatus(agent.id, newStatus);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      department_id: null,
      external_id: '',
      skills: [],
      max_concurrent_chats: 5,
      is_active: true,
    });
    setSkillsInput('');
  };

  const openCreateModal = () => {
    setEditingAgent(null);
    resetForm();
    setShowModal(true);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Atendentes</h1>
          <p className="text-gray-600 mt-1">Gerencie os atendentes humanos</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Novo Atendente
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os departamentos</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="busy">Ocupado</option>
          <option value="away">Ausente</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Agents Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Atendente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Departamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skills
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agents.map((agent) => {
              const status = statusConfig[agent.status];
              return (
                <tr key={agent.id} className={!agent.is_active ? 'opacity-60' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Headphones className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{agent.name}</div>
                        <div className="text-sm text-gray-500">{agent.email || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {agent.department_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={agent.status}
                      onChange={(e) => handleStatusChange(agent, e.target.value as AgentStatus)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color} border-0 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="busy">Ocupado</option>
                      <option value="away">Ausente</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {agent.current_chat_count}/{agent.max_concurrent_chats}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {agent.skills.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-500 text-xs">
                          +{agent.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(agent)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                      title="Desativar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <Headphones className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum atendente</h3>
            <p className="mt-1 text-sm text-gray-500">
              Cadastre atendentes para receber conversas.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowModal(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingAgent ? 'Editar Atendente' : 'Novo Atendente'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, department_id: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sem departamento</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="vendas, suporte, técnico"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máx. Chats Simultâneos
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.max_concurrent_chats}
                    onChange={(e) =>
                      setFormData({ ...formData, max_concurrent_chats: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Atendente ativo
                  </label>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingAgent ? 'Salvar' : 'Criar'}
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
