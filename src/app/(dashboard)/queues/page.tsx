'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Layers, Users, Clock } from 'lucide-react';
import { queuesApi, departmentsApi } from '@/lib/api/ontology';
import type { Queue, QueueCreate, QueueUpdate, RoutingStrategy, Department } from '@/lib/api/types';

const strategyLabels: Record<RoutingStrategy, string> = {
  round_robin: 'Round Robin',
  least_busy: 'Menos Ocupado',
  skill_based: 'Por Skills',
};

export default function QueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);

  // Filters
  const [filterDepartment, setFilterDepartment] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<QueueCreate>({
    name: '',
    description: '',
    department_id: null,
    priority: 0,
    is_default: false,
    routing_strategy: 'round_robin',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, [filterDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [queuesData, deptsData] = await Promise.all([
        queuesApi.list({ department_id: filterDepartment || undefined }),
        departmentsApi.list(),
      ]);
      setQueues(queuesData);
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
      if (editingQueue) {
        await queuesApi.update(editingQueue.id, formData as QueueUpdate);
      } else {
        await queuesApi.create(formData);
      }
      setShowModal(false);
      setEditingQueue(null);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar fila');
    }
  };

  const handleEdit = (queue: Queue) => {
    setEditingQueue(queue);
    setFormData({
      name: queue.name,
      description: queue.description || '',
      department_id: queue.department_id,
      priority: queue.priority,
      is_default: queue.is_default,
      routing_strategy: queue.routing_strategy,
      is_active: queue.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar esta fila?')) return;
    try {
      await queuesApi.delete(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar fila');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      department_id: null,
      priority: 0,
      is_default: false,
      routing_strategy: 'round_robin',
      is_active: true,
    });
  };

  const openCreateModal = () => {
    setEditingQueue(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Filas</h1>
          <p className="text-gray-600 mt-1">Gerencie as filas de atendimento</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nova Fila
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
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Queues Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {queues.map((queue) => (
          <div
            key={queue.id}
            className={`bg-white rounded-lg border p-4 ${
              queue.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Layers className="text-purple-600" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{queue.name}</h3>
                    {queue.is_default && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Padrão
                      </span>
                    )}
                  </div>
                  {queue.department_name && (
                    <p className="text-sm text-gray-500">{queue.department_name}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(queue)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(queue.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Desativar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {queue.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{queue.description}</p>
            )}

            {/* Stats */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-gray-400" />
                <span
                  className={`font-medium ${
                    queue.pending_count > 0 ? 'text-orange-600' : 'text-gray-600'
                  }`}
                >
                  {queue.pending_count} na fila
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Prioridade: {queue.priority}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {strategyLabels[queue.routing_strategy]}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  queue.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {queue.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {queues.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Layers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma fila</h3>
          <p className="mt-1 text-sm text-gray-500">
            Crie filas para organizar o atendimento por departamento.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nova Fila
          </button>
        </div>
      )}

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
                {editingQueue ? 'Editar Fila' : 'Nova Fila'}
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
                    placeholder="Ex: Vendas - Geral, Suporte Técnico"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estratégia
                    </label>
                    <select
                      value={formData.routing_strategy}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          routing_strategy: e.target.value as RoutingStrategy,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="round_robin">Round Robin</option>
                      <option value="least_busy">Menos Ocupado</option>
                      <option value="skill_based">Por Skills</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_default" className="text-sm text-gray-700">
                      Fila padrão do departamento
                    </label>
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
                      Fila ativa
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingQueue ? 'Salvar' : 'Criar'}
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
