'use client';

import { useAuth } from '@/hooks/use-auth';
import { MessageSquare, Building2, Users, TrendingUp } from 'lucide-react';

const stats = [
  { name: 'Organizacoes', value: '0', icon: Building2, change: '+0%' },
  { name: 'Conversas Hoje', value: '0', icon: MessageSquare, change: '+0%' },
  { name: 'Usuarios Ativos', value: '0', icon: Users, change: '+0%' },
  { name: 'Mensagens/Mes', value: '0', icon: TrendingUp, change: '+0%' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bem-vindo, {user?.displayName || user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden rounded-lg shadow px-4 py-5"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Atividade Recente
            </h3>
          </div>
          <div className="px-4 py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma atividade recente
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              As conversas aparecerao aqui quando iniciarem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
