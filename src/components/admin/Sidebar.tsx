'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Flame,
  Mail,
  Upload,
  Workflow,
  Settings,
  LogOut,
  X,
  PenSquare,
} from 'lucide-react';

interface SidebarProps {
  userName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/partnership-admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/partnership-admin/compose', icon: PenSquare, label: 'Compose Email' },
  { href: '/partnership-admin/leads', icon: Users, label: 'All Leads' },
  { href: '/partnership-admin/leads?filter=hot', icon: Flame, label: 'Hot Prospects' },
  { href: '/partnership-admin/sequences', icon: Workflow, label: 'Sequences' },
  { href: '/partnership-admin/templates', icon: Mail, label: 'Email Templates' },
  { href: '/partnership-admin/import', icon: Upload, label: 'Import Prospects' },
  { href: '/partnership-admin/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ userName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/partnership-admin/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-[#0F75BD] to-[#0a5a94]
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-lg">Partnership CRM</h1>
              <p className="text-blue-200 text-sm">Upgraded Points</p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/partnership-admin' &&
                  pathname.startsWith(item.href.split('?')[0]));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="text-white font-medium">{userName || 'Admin'}</p>
                <p className="text-blue-200 text-xs">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
