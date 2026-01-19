'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Network,
  GitBranch,
  Headphones,
  Bot,
  Layers,
  Plug,
} from 'lucide-react';
import { useState } from 'react';
import { OrgSelector } from '@/components/org-selector';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    items: [
      { name: 'Visao Geral', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Estrutura Organizacional',
    items: [
      { name: 'Departamentos', href: '/departments', icon: Network },
      { name: 'Atendentes', href: '/agents', icon: Headphones },
      { name: 'Filas', href: '/queues', icon: Layers },
      { name: 'Agentes AI', href: '/ai-agents', icon: Bot },
    ],
  },
  {
    title: 'Roteamento',
    items: [
      { name: 'Integracoes', href: '/integrations', icon: Plug },
      { name: 'Canvas de Conexoes', href: '/routing-canvas', icon: GitBranch },
    ],
  },
  {
    items: [
      { name: 'Organizacoes', href: '/organizations', icon: Building2 },
      { name: 'Configuracoes', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Org Selector in Header */}
          <div className="flex items-center h-16 px-3 border-b border-gray-200">
            <OrgSelector />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
            {navigationSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {section.title && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon size={20} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-700 font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
