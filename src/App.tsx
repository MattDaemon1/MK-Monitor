import React, { useState, useEffect, useCallback } from 'react';
import { SiteFleetRecord, GlobalFleetKPIs, SiteConfig } from './types';
import { TopBar } from './components/TopBar';
import { KPIGrid } from './components/KPIGrid';
import { FleetTable } from './components/FleetTable';
import { SiteDetailModal } from './components/SiteDetailModal';
import { AddSiteModal } from './components/AddSiteModal';
import { ReportsView } from './components/ReportsView';
import { GuideCLIView } from './components/GuideCLIView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'overview' | 'sites' | 'reports' | 'guide'>('overview');
  const [sites, setSites] = useState<SiteFleetRecord[]>([]);
  const [kpis, setKpis] = useState<GlobalFleetKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteFleetRecord | null>(null);
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteFleetRecord | null>(null);
  const [tableFilter, setTableFilter] = useState<'all' | 'alert' | 'ssl' | 'slow' | 'healthy'>('all');

  const fetchData = useCallback(async () => {
    try {
      const [sitesRes, kpisRes] = await Promise.all([
        fetch('/api/sites'),
        fetch('/api/kpis')
      ]);

      if (sitesRes.ok) {
        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data);
          // If a site modal is open, update selected site reference
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
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 8 seconds
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleScanAll = async () => {
    setIsScanning(true);
    try {
      await fetch('/api/sites/audit-all', { method: 'POST' });
      // Poll faster while scanning
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
      const res = await fetch(`/api/sites/${id}/check`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Erreur quick check:', err);
    }
  };

  const handleDeepAudit = async (id: string) => {
    // Set optimistic auditing state
    setSites((prev) =>
      prev.map((s) => (s.config.id === id ? { ...s, isAuditing: true } : s))
    );
    try {
      const res = await fetch(`/api/sites/${id}/audit`, { method: 'POST' });
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
      // Update
      const res = await fetch(`/api/sites/${editingSite.config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      });
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || 'Erreur mise à jour');
      }
    } else {
      // Create
      const res = await fetch('/api/sites', {
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
      await fetch(`/api/sites/${id}`, { method: 'DELETE' });
      await fetchData();
    }
  };

  const handleResetDefaults = async () => {
    await fetch('/api/sites/reset', { method: 'POST' });
    await fetchData();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onScanAll={handleScanAll}
        isScanning={isScanning}
        totalSites={sites.length}
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
          <ReportsView sites={sites} kpis={kpis} />
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
    </div>
  );
}
