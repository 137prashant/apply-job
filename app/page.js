'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EmailManager from './components/EmailManager';
import ApplicationTracker from './components/ApplicationTracker';
import EmailSender from './components/EmailSender';
import { apiFetch } from '../lib/apiClient';
import { MailIcon, ChartIcon, SendIcon, BriefcaseIcon, SpinnerIcon } from './components/ui';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('manage');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiFetch('/api/emails/stats');
      const data = await response.json();
      if (response.ok) {
        setTotalCount(data.total ?? 0);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const tabs = [
    { id: 'manage', label: 'Email Management', icon: MailIcon },
    { id: 'track', label: 'Application Tracker', icon: ChartIcon },
    { id: 'send', label: 'Send Emails', icon: SendIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <SpinnerIcon className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-600">Loading applications…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                <BriefcaseIcon className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Job Application Manager
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage applications and email campaigns
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-600">
                <span className="font-medium text-slate-500">Total</span>
                <span className="font-bold text-slate-900 tabular-nums">{totalCount}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-tab ${activeTab === tab.id ? 'nav-tab-active' : 'nav-tab-inactive'}`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'manage' && (
          <EmailManager onApplicationsChange={fetchStats} />
        )}
        {activeTab === 'track' && <ApplicationTracker />}
        {activeTab === 'send' && (
          <EmailSender onApplicationsChange={fetchStats} />
        )}
      </main>
    </div>
  );
}
