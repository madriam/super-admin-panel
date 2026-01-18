'use client';

import { useEffect, useState } from 'react';
import {
  MessageCircle,
  Instagram,
  Globe,
  Facebook,
  Send,
  Mail,
  Webhook,
  Plus,
  Edit,
  Power,
  PowerOff,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { integrationsApi } from '@/lib/api/ontology';
import type { Integration, IntegrationCreate, IntegrationUpdate, IntegrationType } from '@/lib/api/types';
import { ConfirmDialog } from '@/components/confirm-dialog';

// Integration type options
const INTEGRATION_TYPES: { value: IntegrationType; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { value: 'web_chat', label: 'Web Chat', icon: Globe, color: '#3B82F6' },
  { value: 'messenger', label: 'Messenger', icon: Facebook, color: '#0084FF' },
  { value: 'telegram', label: 'Telegram', icon: Send, color: '#0088CC' },
  { value: 'email', label: 'E-mail', icon: Mail, color: '#EA4335' },
  { value: 'api', label: 'API', icon: Webhook, color: '#6366F1' },
];

const getIntegrationType = (type: IntegrationType) =>
  INTEGRATION_TYPES.find((t) => t.value === type) || INTEGRATION_TYPES[6];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<IntegrationCreate>({
    type: 'whatsapp',
    name: '',
    description: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string[];
    onConfirm: () => void;
    variant: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await integrationsApi.list();
      setIntegrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingIntegration) {
        const updateData: IntegrationUpdate = {
          name: formData.name,
          description: formData.description,
        };
        await integrationsApi.update(editingIntegration.id, updateData);
        setSuccess('Integração atualizada com sucesso!');
      } else {
        await integrationsApi.create(formData);
        setSuccess('Integração criada com sucesso!');
      }
      setShowModal(false);
      setEditingIntegration(null);
      setFormData({ type: 'whatsapp', name: '', description: '', is_active: true });
      await loadIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar integração');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormData({
      type: integration.type,
      name: integration.name,
      description: integration.description || '',
      is_active: integration.is_active,
    });
    setShowModal(true);
  };

  const handleDisable = async (integration: Integration) => {
    try {
      // Check for routing impact first
      const impact = await integrationsApi.getRoutingImpact(integration.id);

      if (impact.affected_routing_rules > 0) {
        setConfirmDialog({
          isOpen: true,
          title: 'Desativar Integração',
          message: `A integração "${integration.name}" possui ${impact.affected_routing_rules} regra(s) de roteamento. Ao desativar, essas regras serão removidas.`,
          details: [
            `${impact.affected_routing_rules} regra(s) de roteamento serão removidas`,
            'Esta ação não pode ser desfeita',
          ],
          variant: 'warning',
          onConfirm: async () => {
            try {
              await integrationsApi.disable(integration.id, true);
              setSuccess('Integração desativada com sucesso!');
              await loadIntegrations();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Erro ao desativar integração');
            }
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          },
        });
      } else {
        // No routing rules, just disable
        await integrationsApi.disable(integration.id, false);
        setSuccess('Integração desativada com sucesso!');
        await loadIntegrations();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar integração');
    }
  };

  const handleEnable = async (integration: Integration) => {
    try {
      await integrationsApi.update(integration.id, { is_active: true });
      setSuccess('Integração ativada com sucesso!');
      await loadIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar integração');
    }
  };

  const handleDelete = (integration: Integration) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Integração',
      message: `Tem certeza que deseja excluir a integração "${integration.name}"?`,
      details: [
        'Esta ação não pode ser desfeita',
        'Todas as regras de roteamento associadas serão removidas',
      ],
      variant: 'danger',
      onConfirm: async () => {
        try {
          await integrationsApi.delete(integration.id);
          setSuccess('Integração excluída com sucesso!');
          await loadIntegrations();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erro ao excluir integração');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const openCreateModal = () => {
    setEditingIntegration(null);
    setFormData({ type: 'whatsapp', name: '', description: '', is_active: true });
    setShowModal(true);
  };

  // Clear success/error after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
          <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
          <p className="text-gray-600 mt-1">
            Gerencie canais de entrada (WhatsApp, Instagram, etc.)
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nova Integração
        </button>
      </div>

      {/* Success/Error alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
          <button onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Empty state */}
      {integrations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={32} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma integração configurada
          </h3>
          <p className="text-gray-500 mb-4">
            Adicione uma integração para começar a receber conversas de canais como WhatsApp, Instagram, etc.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Adicionar Integração
          </button>
        </div>
      ) : (
        /* Integrations grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => {
            const typeInfo = getIntegrationType(integration.type);
            const IconComponent = typeInfo.icon;

            return (
              <div
                key={integration.id}
                className={`bg-white rounded-lg border p-4 ${
                  integration.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: integration.color || typeInfo.color }}
                    >
                      <IconComponent size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{integration.name}</h3>
                      <span className="text-xs text-gray-500 capitalize">{typeInfo.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {integration.is_verified && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle size={12} />
                        Verificado
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {integration.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {integration.description}
                  </p>
                )}

                {/* Status */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      integration.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        integration.is_active ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    {integration.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(integration)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                  {integration.is_active ? (
                    <button
                      onClick={() => handleDisable(integration)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                      <PowerOff size={14} />
                      Desativar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnable(integration)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Power size={14} />
                      Ativar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(integration)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} className="text-gray-500" />
              </button>

              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingIntegration ? 'Editar Integração' : 'Nova Integração'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type selection (only for new) */}
                {!editingIntegration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Integração
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {INTEGRATION_TYPES.map((type) => {
                        const IconComp = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, type: type.value })}
                            className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                              formData.type === type.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: type.color }}
                            >
                              <IconComp size={16} className="text-white" />
                            </div>
                            <span className="text-xs text-gray-700">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: WhatsApp Vendas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da integração..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : editingIntegration ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        details={confirmDialog.details}
        variant={confirmDialog.variant}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
