'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSuperAdminAuth } from '@/hooks/use-super-admin-auth';
import {
  LayoutDashboard,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Bot,
  Share2,
  Shield,
  CreditCard,
  Activity,
} from 'lucide-react';
import { useState } from 'react';

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
      { name: 'Dashboard Global', href: '/super', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Gestao de Plataforma',
    items: [
      { name: 'Organizacoes', href: '/super/organizations', icon: Building2 },
      { name: 'AI Agents', href: '/super/ai-agents', icon: Bot },
      { name: 'Delegacoes', href: '/super/delegations', icon: Share2 },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { name: 'Planos e Billing', href: '/super/billing', icon: CreditCard },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { name: 'Saude do Sistema', href: '/super/system/health', icon: Activity },
      { name: 'Configuracoes', href: '/super/settings', icon: Settings },
    ],
  },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useSuperAdminAuth();
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
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center h-16 px-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-indigo-400" />
              <div>
                <span className="font-semibold text-lg">MADRIAM</span>
                <span className="ml-2 text-xs bg-indigo-600 px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
            {navigationSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {section.title && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href ||
                      (item.href !== '/super' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'Super Admin'}
                </p>
                <p className="text-xs text-slate-400 truncate">Administrador</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
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
