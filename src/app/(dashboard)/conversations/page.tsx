'use client';

import { useState } from 'react';
import { MessageSquare, Search, Filter, ExternalLink } from 'lucide-react';

interface Conversation {
  id: string;
  phoneNumber: string;
  organizationName: string;
  status: 'active' | 'handoff' | 'closed';
  lastMessage: string;
  updatedAt: string;
}

// TODO: Fetch from API
const mockConversations: Conversation[] = [];

const statusColors = {
  active: 'bg-green-100 text-green-800',
  handoff: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  active: 'Ativo',
  handoff: 'Handoff',
  closed: 'Encerrado',
};

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredConversations = mockConversations.filter((conv) => {
    const matchesSearch =
      conv.phoneNumber.includes(searchQuery) ||
      conv.organizationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visualize todas as conversas de WhatsApp
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por telefone ou organizacao..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="handoff">Handoff</option>
            <option value="closed">Encerrados</option>
          </select>
        </div>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="bg-white shadow rounded-lg px-4 py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhuma conversa
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            As conversas aparecerao aqui quando clientes enviarem mensagens.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map((conv) => (
              <li key={conv.id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {conv.phoneNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {conv.organizationName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[conv.status]}`}>
                        {statusLabels[conv.status]}
                      </span>
                      {conv.status === 'handoff' && (
                        <a
                          href="#"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="Abrir no Chatwoot"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(conv.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
