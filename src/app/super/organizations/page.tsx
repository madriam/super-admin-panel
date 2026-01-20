'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  ExternalLink,
  Filter,
  Power,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { organizationsApi } from '@/lib/api/ontology';
import type { OrganizationSummary, OrganizationCreate, Organization } from '@/lib/api/types';

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-blue-100 text-blue-800',
  pro: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-amber-100 text-amber-800',
};

const PLAN_LABELS = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const PLAN_LIMITS = {
  free: 1000,
  starter: 5000,
  pro: 20000,
  enterprise: 100000,
};

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<OrganizationCreate>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    tax_id: '',
    city: '',
    state: '',
    country: 'Brasil',
    plan: 'free',
    messages_limit: PLAN_LIMITS.free,
  });

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await organizationsApi.list();
      setOrganizations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar organizacoes');
    } finally {
      setLoading(false);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    try {
      setCheckingSlug(true);
      const result = await organizationsApi.checkSlug(slug);
      setSlugAvailable(result.available);
    } catch {
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    if (!showEditModal) {
      const slug = generateSlug(name);
      setFormData((prev) => ({ ...prev, name, slug }));
      checkSlugAvailability(slug);
    }
  };

  const handleSlugChange = (slug: string) => {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, slug: cleanSlug });
    checkSlugAvailability(cleanSlug);
  };

  const handlePlanChange = (plan: OrganizationCreate['plan']) => {
    setFormData({
      ...formData,
      plan,
      messages_limit: PLAN_LIMITS[plan || 'free'],
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.slug || !slugAvailable) return;

    try {
      setSaving(true);
      await organizationsApi.create(formData);
      setShowCreateModal(false);
      resetForm();
      loadOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar organizacao');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (org: OrganizationSummary) => {
    try {
      const fullOrg = await organizationsApi.get(org.id);
      setSelectedOrg(fullOrg);
      setFormData({
        name: fullOrg.name,
        slug: fullOrg.slug,
        email: fullOrg.email || '',
        phone: fullOrg.phone || '',
        tax_id: fullOrg.tax_id || '',
        city: fullOrg.city || '',
        state: fullOrg.state || '',
        country: fullOrg.country,
        plan: fullOrg.plan,
        messages_limit: fullOrg.messages_limit,
      });
      setShowEditModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar organizacao');
    }
  };

  const handleUpdate = async () => {
    if (!selectedOrg) return;

    try {
      setSaving(true);
      await organizationsApi.update(selectedOrg.id, {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        tax_id: formData.tax_id || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country,
        plan: formData.plan,
        messages_limit: formData.messages_limit,
      });
      setShowEditModal(false);
      setSelectedOrg(null);
      resetForm();
      loadOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar organizacao');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (org: OrganizationSummary) => {
    const action = org.is_active ? 'desativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${action} a organizacao "${org.name}"?`)) return;

    try {
      await organizationsApi.update(org.id, { is_active: !org.is_active });
      loadOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao ${action} organizacao`);
    }
  };

  const handleDelete = async (org: OrganizationSummary) => {
    if (!confirm(`ATENCAO: Esta acao ira REMOVER PERMANENTEMENTE a organizacao "${org.name}" e todos os seus dados. Deseja continuar?`)) return;
    if (!confirm(`Confirme novamente: Remover permanentemente "${org.name}"?`)) return;

    try {
      await organizationsApi.delete(org.id);
      loadOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover organizacao');
    }
  };

  const handleEnterAsAdmin = (org: OrganizationSummary) => {
    // Set impersonation cookie and redirect to org panel
    document.cookie = `impersonation_org_id=${org.id}; path=/; max-age=3600; SameSite=Strict`;
    document.cookie = `impersonation_org_name=${encodeURIComponent(org.name)}; path=/; max-age=3600; SameSite=Strict`;

    // In production, redirect to org panel domain
    // In development, stay on same domain but show org context
    if (process.env.NODE_ENV === 'production') {
      window.location.href = `https://panel.ilhaperdida.com.br?org=${org.id}`;
    } else {
      // For development, we'll use query params to simulate impersonation
      window.location.href = `/?impersonate=${org.id}`;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      email: '',
      phone: '',
      tax_id: '',
      city: '',
      state: '',
      country: 'Brasil',
      plan: 'free',
      messages_limit: PLAN_LIMITS.free,
    });
    setSlugAvailable(null);
  };

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || org.plan === filterPlan;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && org.is_active) ||
      (filterStatus === 'inactive' && !org.is_active);
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Stats
  const stats = {
    total: organizations.length,
    active: organizations.filter((o) => o.is_active).length,
    byPlan: {
      free: organizations.filter((o) => o.plan === 'free').length,
      starter: organizations.filter((o) => o.plan === 'starter').length,
      pro: organizations.filter((o) => o.plan === 'pro').length,
      enterprise: organizations.filter((o) => o.plan === 'enterprise').length,
    },
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
          <h1 className="text-2xl font-bold text-gray-900">Organizacoes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todas as organizacoes da plataforma
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Nova Organizacao
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Ativas</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Free</p>
          <p className="text-2xl font-bold text-gray-600">{stats.byPlan.free}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Starter/Pro</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.byPlan.starter + stats.byPlan.pro}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Enterprise</p>
          <p className="text-2xl font-bold text-amber-600">{stats.byPlan.enterprise}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por nome ou slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos os planos</option>
              <option value="free">Gratuito</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Organizations List */}
      {filteredOrgs.length === 0 ? (
        <div className="bg-white shadow rounded-lg px-4 py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma organizacao encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || filterPlan !== 'all' || filterStatus !== 'all'
              ? 'Tente ajustar os filtros.'
              : 'Comece criando uma nova organizacao.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organizacao
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uso de Mensagens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Acoes</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrgs.map((org) => {
                const usagePercent =
                  org.messages_limit > 0
                    ? Math.round((org.messages_used / org.messages_limit) * 100)
                    : 0;
                return (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>{org.slug}</span>
                            <a
                              href={`https://${org.slug}.panel.ilhaperdida.com.br`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-500 hover:text-indigo-700 transition-colors"
                              title={`Abrir painel: https://${org.slug}.panel.ilhaperdida.com.br`}
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${PLAN_COLORS[org.plan]}`}
                      >
                        {PLAN_LABELS[org.plan]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {org.messages_used.toLocaleString()} / {org.messages_limit.toLocaleString()}
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            usagePercent >= 90
                              ? 'bg-red-500'
                              : usagePercent >= 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, usagePercent)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {org.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <CheckCircle size={12} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          <XCircle size={12} />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(org.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        {/* Enter as Admin */}
                        <button
                          onClick={() => handleEnterAsAdmin(org)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                          title="Entrar como Admin"
                        >
                          <Users size={14} />
                          Entrar
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(org)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(org)}
                          className={`p-1.5 rounded ${
                            org.is_active
                              ? 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'
                              : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={org.is_active ? 'Desativar' : 'Ativar'}
                        >
                          <Power size={16} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(org)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Remover permanentemente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {showEditModal ? 'Editar Organizacao' : 'Nova Organizacao'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedOrg(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Auto Pecas Silva"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (identificador unico) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    disabled={showEditModal}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      showEditModal
                        ? 'bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed'
                        : 'border-gray-300'
                    }`}
                    placeholder="auto-pecas-silva"
                  />
                  {!showEditModal && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingSlug ? (
                        <Loader2 className="animate-spin h-4 w-4 text-gray-400" />
                      ) : slugAvailable === true ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : slugAvailable === false ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                {slugAvailable === false && (
                  <p className="text-sm text-red-500 mt-1">Este slug ja esta em uso</p>
                )}
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* CNPJ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={formData.tax_id || ''}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="00.000.000/0001-00"
                />
              </div>

              {/* City and State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Sao Paulo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="SP"
                  />
                </div>
              </div>

              {/* Plan and Messages Limit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
                  <select
                    value={formData.plan}
                    onChange={(e) =>
                      handlePlanChange(e.target.value as OrganizationCreate['plan'])
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="free">Gratuito (1k msg)</option>
                    <option value="starter">Starter (5k msg)</option>
                    <option value="pro">Pro (20k msg)</option>
                    <option value="enterprise">Enterprise (100k msg)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite de Mensagens
                  </label>
                  <input
                    type="number"
                    value={formData.messages_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, messages_limit: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedOrg(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={showEditModal ? handleUpdate : handleCreate}
                disabled={
                  saving || (!showEditModal && (!formData.name || !formData.slug || !slugAvailable))
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin h-4 w-4" />}
                {showEditModal ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
