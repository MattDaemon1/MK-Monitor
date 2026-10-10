import React, { useState, useEffect, useCallback } from 'react';
import { SiteFleetRecord, GlobalFleetKPIs, SiteConfig } from './types.ts';
import { TopBar } from './components/TopBar.tsx';
import { KPIGrid } from './components/KPIGrid.tsx';
import { FleetTable } from './components/FleetTable.tsx';
import { SiteDetailModal } from './components/SiteDetailModal.tsx';
import { AddSiteModal } from './components/AddSiteModal.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { GuideCLIView } from './components/GuideCLIView.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('mk_auth_token') || sessionStorage.getItem('mk_auth_token') || null;
  });
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('mk_auth_user') || sessionStorage.getItem('mk_auth_user') || 'admin';
  });
  const [authChecking, setAuthChecking] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [currentTab, setCurrentTab] = useState<'overview' | 'sites' | 'reports' | 'guide'>('overview');
  const [sites, setSites] = useState<SiteFleetRecord[]>([]);
  const [kpis, setKpis] = useState<GlobalFleetKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteFleetRecord | null>(null);
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteFleetRecord | null>(null);
  const [tableFilter, setTableFilter] = useState<'all' | 'alert' | 'ssl' | 'slow' | 'healthy'>('all');

  const handleLogout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem('mk_auth_token');
    localStorage.removeItem('mk_auth_user');
    sessionStorage.removeItem('mk_auth_token');
    sessionStorage.removeItem('mk_auth_user');
    setToken(null);
  }, [token]);

  // Auth-aware fetch wrapper
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Non authentifié');

    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      handleLogout();
      throw new Error('Session expirée');
    }
    return res;
  }, [token, handleLogout]);

  // Verify auth token on startup
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setAuthChecking(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.authenticated) {
          handleLogout();
        }
      } catch {
        // In case of network check failure, keep token or re-prompt if needed
      } finally {
        setAuthChecking(false);
      }
    }

    verifyAuth();
  }, [token, handleLogout]);

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      const [sitesRes, kpisRes] = await Promise.all([
        fetchWithAuth('/api/sites'),
        fetchWithAuth('/api/kpis')
      ]);

      if (sitesRes.ok) {
        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data);
          setSelectedSite((current) => {
            if (!current) return null;
            return sitesJson.data.find((s: SiteFleetRecord) => s.config.id === current.config.id) || current;
          });
        }
      }

      if (kpisRes.ok) {
        const kpisJson = await kpisRes.json();
        if (kpisJson.success) {
          setKpis(kpisJson.data);
        }
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  }, [token, fetchWithAuth]);

  useEffect(() => {
    if (!token) return;
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [token, fetchData]);

  const handleLoginSuccess = (newToken: string, user: string) => {
    setToken(newToken);
    setCurrentUser(user);
    setLoading(true);
  };

  const handleScanAll = async () => {
    setIsScanning(true);
    try {
      await fetchWithAuth('/api/sites/audit-all', { method: 'POST' });
      setTimeout(fetchData, 1500);
      setTimeout(fetchData, 4000);
      setTimeout(() => {
        fetchData();
        setIsScanning(false);
      }, 7000);
    } catch {
      setIsScanning(false);
    }
  };

  const handleQuickCheck = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/sites/${id}/check`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Erreur quick check:', err);
    }
  };

  const handleDeepAudit = async (id: string) => {
    setSites((prev) =>
      prev.map((s) => (s.config.id === id ? { ...s, isAuditing: true } : s))
    );
    try {
      const res = await fetchWithAuth(`/api/sites/${id}/audit`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Erreur deep audit:', err);
    } finally {
      setSites((prev) =>
        prev.map((s) => (s.config.id === id ? { ...s, isAuditing: false } : s))
      );
    }
  };

  const handleSaveSite = async (siteData: Partial<SiteConfig>) => {
    if (editingSite) {
      const res = await fetchWithAuth(`/api/sites/${editingSite.config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      });
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || 'Erreur mise à jour');
      }
    } else {
      const res = await fetchWithAuth('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      });
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || 'Erreur création');
      }
    }
    await fetchData();
  };

  const handleDeleteSite = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir retirer ce site de la surveillance ?')) {
      await fetchWithAuth(`/api/sites/${id}`, { method: 'DELETE' });
      await fetchData();
    }
  };

  const handleResetDefaults = async () => {
    await fetchWithAuth('/api/sites/reset', { method: 'POST' });
    await fetchData();
  };

  // While verifying stored token, display minimal loading state
  if (authChecking) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-xs text-neutral-400 font-mono">
        Chargement de MK Monitor...
      </div>
    );
  }

  // If not logged in, show secure login screen
  if (!token) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar with auth actions */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onScanAll={handleScanAll}
        isScanning={isScanning}
        totalSites={sites.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Strip visible in Overview and Sites */}
        {(currentTab === 'overview' || currentTab === 'sites') && (
          <KPIGrid
            kpis={kpis}
            onFilterAlerts={() => {
              setTableFilter('alert');
              setCurrentTab('sites');
            }}
            onFilterExpiringSSL={() => {
              setTableFilter('ssl');
              setCurrentTab('sites');
            }}
          />
        )}

        {/* TAB 1: OVERVIEW & FLEET TABLE */}
        {currentTab === 'overview' && (
          <div className="space-y-6">
            <FleetTable
              sites={sites}
              onSelectSite={setSelectedSite}
              onQuickCheck={handleQuickCheck}
              onDeepAudit={handleDeepAudit}
              onAddSite={() => {
                setEditingSite(null);
                setIsAddSiteOpen(true);
              }}
              onEditSite={(site) => {
                setEditingSite(site);
                setIsAddSiteOpen(true);
              }}
              onDeleteSite={handleDeleteSite}
              activeFilter={tableFilter}
              onChangeFilter={setTableFilter}
            />
          </div>
        )}

        {/* TAB 2: SITES VIEW */}
        {currentTab === 'sites' && (
          <div className="space-y-6">
            <FleetTable
              sites={sites}
              onSelectSite={setSelectedSite}
              onQuickCheck={handleQuickCheck}
              onDeepAudit={handleDeepAudit}
              onAddSite={() => {
                setEditingSite(null);
                setIsAddSiteOpen(true);
              }}
              onEditSite={(site) => {
                setEditingSite(site);
                setIsAddSiteOpen(true);
              }}
              onDeleteSite={handleDeleteSite}
              activeFilter={tableFilter}
              onChangeFilter={setTableFilter}
            />
          </div>
        )}

        {/* TAB 3: REPORTS & EXPORTS */}
        {currentTab === 'reports' && (
          <ReportsView sites={sites} kpis={kpis} token={token} />
        )}

        {/* TAB 4: GUIDE & CLI */}
        {currentTab === 'guide' && (
          <GuideCLIView onResetDefaults={handleResetDefaults} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>MK Monitor · Surveillance & Audit Web Matt Konnect</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="hover:text-neutral-300 transition-colors"
            >
              Sécurité du compte
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentTab('guide')}
              className="hover:text-neutral-300 transition-colors"
            >
              Documentation & CLI
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentTab('reports')}
              className="hover:text-neutral-300 transition-colors"
            >
              Exports JSON/CSV
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Detail Site */}
      {selectedSite && (
        <SiteDetailModal
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
          onRunAudit={handleDeepAudit}
          onQuickCheck={handleQuickCheck}
        />
      )}

      {/* Modal Add/Edit Site */}
      <AddSiteModal
        initialSite={editingSite}
        isOpen={isAddSiteOpen}
        onClose={() => {
          setIsAddSiteOpen(false);
          setEditingSite(null);
        }}
        onSave={handleSaveSite}
      />

      {/* Modal Change Password */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        token={token}
      />
    </div>
  );
}
