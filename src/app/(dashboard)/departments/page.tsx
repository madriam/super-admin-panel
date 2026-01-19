'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Network, Users, Layers, Loader2 } from 'lucide-react';
import { departmentsApi } from '@/lib/api/ontology';
import { useOrganization } from '@/contexts/organization-context';
import type { Department, DepartmentCreate, DepartmentUpdate } from '@/lib/api/types';

export default function DepartmentsPage() {
  const { tenantId } = useOrganization();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  // Form state
  const [formData, setFormData] = useState<DepartmentCreate>({
    name: '',
    description: '',
    parent_department_id: null,
    is_active: true,
  });

  useEffect(() => {
    if (tenantId) {
      loadDepartments();
    }
  }, [tenantId]);

  const loadDepartments = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const data = await departmentsApi.list(tenantId);
      setDepartments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      if (editingDepartment) {
        await departmentsApi.update(tenantId, editingDepartment.id, formData as DepartmentUpdate);
      } else {
        await departmentsApi.create(tenantId, formData);
      }
      setShowModal(false);
      setEditingDepartment(null);
      setFormData({ name: '', description: '', parent_department_id: null, is_active: true });
      loadDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar departamento');
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      parent_department_id: dept.parent_department_id,
      is_active: dept.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    if (!confirm('Tem certeza que deseja desativar este departamento?')) return;

    try {
      await departmentsApi.delete(tenantId, id);
      loadDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar departamento');
    }
  };

  const openCreateModal = () => {
    setEditingDepartment(null);
    setFormData({ name: '', description: '', parent_department_id: null, is_active: true });
    setShowModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Departamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie a estrutura organizacional</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Novo Departamento
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Departments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className={`bg-white rounded-lg border p-4 ${
              dept.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Network className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                  {dept.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dept.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(dept)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Desativar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={16} />
                <span>{dept.agent_count} atendentes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Layers size={16} />
                <span>{dept.queue_count} filas</span>
              </div>
            </div>

            {/* Status badge */}
            <div className="mt-3">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  dept.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {dept.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {departments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Network className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum departamento</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece criando o primeiro departamento da organizacao.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Novo Departamento
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
                {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
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
                    placeholder="Ex: Vendas, Suporte, Financeiro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descricao
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Descricao do departamento..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento Pai
                  </label>
                  <select
                    value={formData.parent_department_id || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parent_department_id: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Nenhum (departamento raiz)</option>
                    {departments
                      .filter((d) => d.id !== editingDepartment?.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
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
                    Departamento ativo
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
                    {editingDepartment ? 'Salvar' : 'Criar'}
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
