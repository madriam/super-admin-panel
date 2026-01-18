'use client';

import { useAuth } from '@/hooks/use-auth';
import { User, Bell, Shield, Key } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie suas preferencias e conta
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Perfil</h3>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-medium text-blue-700">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {user?.displayName || 'Usuario'}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  defaultValue={user?.displayName || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Salvar Alteracoes
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Notificacoes</h3>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Notificacoes por email
                  </p>
                  <p className="text-sm text-gray-500">
                    Receba atualizacoes sobre novas conversas
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-blue-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  role="switch"
                  aria-checked="true"
                >
                  <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Alertas de handoff
                  </p>
                  <p className="text-sm text-gray-500">
                    Seja notificado quando uma conversa precisar de atencao humana
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-blue-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  role="switch"
                  aria-checked="true"
                >
                  <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Seguranca</h3>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Autenticacao
                    </p>
                    <p className="text-sm text-gray-500">
                      Autenticacao desabilitada temporariamente
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
