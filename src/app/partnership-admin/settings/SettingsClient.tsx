'use client';

import { useState } from 'react';
import {
  Menu,
  User,
  Mail,
  Shield,
  Database,
  Check,
} from 'lucide-react';
import { Sidebar } from '@/components/admin';

interface SettingsClientProps {
  userName: string;
  userEmail: string;
}

export function SettingsClient({ userName, userEmail }: SettingsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar
        userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-500">Manage your CRM settings</p>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-3xl">
          <div className="space-y-6">
            {/* Account */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Account</h2>
                  <p className="text-sm text-slate-500">Your admin account details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                  <p className="text-slate-900">{userName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                  <p className="text-slate-900">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Email Configuration</h2>
                  <p className="text-sm text-slate-500">Outbound email settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">Resend API</p>
                    <p className="text-sm text-slate-500">Email delivery service</p>
                  </div>
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" /> Configured
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">From Email</p>
                    <p className="text-sm text-slate-500">partnerships@upgradedpoints.com</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">Reply-To</p>
                    <p className="text-sm text-slate-500">partnerships@upgradedpoints.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Security</h2>
                  <p className="text-sm text-slate-500">Security and compliance settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">GDPR Compliance</p>
                    <p className="text-sm text-slate-500">Marketing consent tracking enabled</p>
                  </div>
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" /> Enabled
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">Unsubscribe Links</p>
                    <p className="text-sm text-slate-500">Cryptographically signed URLs</p>
                  </div>
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" /> Enabled
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">Open Tracking</p>
                    <p className="text-sm text-slate-500">Disabled for better deliverability</p>
                  </div>
                  <span className="text-slate-500 text-sm">Disabled</span>
                </div>
              </div>
            </div>

            {/* Database */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Database</h2>
                  <p className="text-sm text-slate-500">Supabase connection</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">Supabase</p>
                    <p className="text-sm text-slate-500">PostgreSQL database</p>
                  </div>
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" /> Connected
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Schema Setup:</strong> If you haven&apos;t already, run the SQL in{' '}
                  <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">
                    src/lib/supabase/schema.sql
                  </code>{' '}
                  in your Supabase SQL Editor to set up all tables.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
