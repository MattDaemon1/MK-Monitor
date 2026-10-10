import React, { useState, useMemo } from 'react';
import { SiteFleetRecord } from '../types';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Play,
  FileSearch,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';

interface FleetTableProps {
  sites: SiteFleetRecord[];
  onSelectSite: (site: SiteFleetRecord) => void;
  onQuickCheck: (id: string) => void;
  onDeepAudit: (id: string) => void;
  onAddSite: () => void;
  onEditSite: (site: SiteFleetRecord) => void;
  onDeleteSite: (id: string) => void;
  activeFilter: 'all' | 'alert' | 'ssl' | 'slow' | 'healthy';
  onChangeFilter: (filter: 'all' | 'alert' | 'ssl' | 'slow' | 'healthy') => void;
}

export const FleetTable: React.FC<FleetTableProps> = ({
  sites,
  onSelectSite,
  onQuickCheck,
  onDeepAudit,
  onAddSite,
  onEditSite,
  onDeleteSite,
  activeFilter,
  onChangeFilter,
}) => {
  const [search, setSearch] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      // Search filter
      const matchesSearch =
        site.config.name.toLowerCase().includes(search.toLowerCase()) ||
        site.config.url.toLowerCase().includes(search.toLowerCase()) ||
        (site.config.category && site.config.category.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      // Status filters
      if (activeFilter === 'alert') {
        const isDown = site.lastUptime?.status === 'DOWN';
        const isSslExpired = site.lastSSL?.status === 'EXPIRED';
        return isDown || isSslExpired;
      }
      if (activeFilter === 'ssl') {
        return site.lastSSL?.status === 'EXPIRING_SOON' || site.lastSSL?.status === 'EXPIRED';
      }
      if (activeFilter === 'slow') {
        return site.lastUptime?.status === 'DEGRADED';
      }
      if (activeFilter === 'healthy') {
        return site.lastUptime?.status === 'UP' && site.lastSSL?.status === 'VALID';
      }

      return true;
    });
  }, [sites, search, activeFilter]);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950/80 border border-neutral-800/80 rounded-lg overflow-x-auto text-xs">
          <button
            onClick={() => onChangeFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Tous ({sites.length})
          </button>
          <button
            onClick={() => onChangeFilter('alert')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'alert'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            En Alerte ({sites.filter(s => s.lastUptime?.status === 'DOWN' || s.lastSSL?.status === 'EXPIRED').length})
          </button>
          <button
            onClick={() => onChangeFilter('ssl')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'ssl'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            SSL &lt; 30j ({sites.filter(s => s.lastSSL?.status === 'EXPIRING_SOON').length})
          </button>
          <button
            onClick={() => onChangeFilter('slow')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'slow'
                ? 'bg-neutral-800 text-neutral-200'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Lents ({sites.filter(s => s.lastUptime?.status === 'DEGRADED').length})
          </button>
          <button
            onClick={() => onChangeFilter('healthy')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'healthy'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sains ({sites.filter(s => s.lastUptime?.status === 'UP' && s.lastSSL?.status === 'VALID').length})
          </button>
        </div>

        {/* Search and Add Site */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, URL, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <button
            onClick={onAddSite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-medium transition-colors whitespace-nowrap border border-neutral-700/80"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ajouter un site</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-800/80 bg-neutral-950/40 text-neutral-400 font-medium">
              <th className="py-3 px-4">Site Web & Catégorie</th>
              <th className="py-3 px-4">Statut Uptime</th>
              <th className="py-3 px-4 text-right">Latence</th>
              <th className="py-3 px-4">Certificat SSL</th>
              <th className="py-3 px-4 text-center">Score Santé</th>
              <th className="py-3 px-4">Tracking</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/40 text-neutral-300">
            {filteredSites.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-500">
                  {search ? (
                    <div>Aucun site ne correspond à votre recherche "{search}"</div>
                  ) : (
                    <div>
                      <p className="mb-3 text-neutral-400">Aucun site surveillé dans cette catégorie.</p>
                      <button
                        onClick={onAddSite}
                        className="px-3.5 py-1.5 bg-emerald-500 text-neutral-950 rounded-lg font-medium hover:bg-emerald-400 transition-colors"
                      >
                        Ajouter un site
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredSites.map((site) => {
                const uptime = site.lastUptime;
                const ssl = site.lastSSL;
                const health = site.lastHealth;
                const isAuditing = site.isAuditing;

                return (
                  <tr
                    key={site.config.id}
                    className="hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectSite(site)}
                  >
                    {/* Site name & domain */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                            {site.config.name}
                          </span>
                          <a
                            href={site.config.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-neutral-500 hover:text-neutral-300"
                            title="Ouvrir dans un nouvel onglet"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                          <span className="truncate max-w-[220px] font-mono">{site.config.url}</span>
                          {site.config.category && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-neutral-400">{site.config.category}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="text-neutral-400 font-mono" title="Fréquence de scan automatique">
                            {(site.config.checkIntervalSeconds ?? 43200) >= 3600
                              ? `${Math.round((site.config.checkIntervalSeconds ?? 43200) / 3600)}h`
                              : `${Math.round((site.config.checkIntervalSeconds ?? 43200) / 60)}m`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Uptime Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {!uptime ? (
                        <span className="text-neutral-500">En attente</span>
                      ) : uptime.status === 'UP' ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>UP {uptime.statusCode || 200}</span>
                        </div>
                      ) : uptime.status === 'DEGRADED' ? (
                        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Lent ({uptime.statusCode})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>DOWN {uptime.statusCode ? `(${uptime.statusCode})` : ''}</span>
                        </div>
                      )}
                    </td>

                    {/* Latency */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {uptime ? (
                        <span
                          className={`font-mono tabular-nums ${
                            uptime.responseTimeMs > 1500
                              ? 'text-amber-400'
                              : uptime.responseTimeMs > 2500
                              ? 'text-rose-400'
                              : 'text-neutral-200'
                          }`}
                        >
                          {uptime.responseTimeMs} ms
                        </span>
                      ) : (
                        <span className="text-neutral-500">-</span>
                      )}
                    </td>

                    {/* SSL */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {!ssl ? (
                        <span className="text-neutral-500">-</span>
                      ) : ssl.status === 'VALID' ? (
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            <strong className="font-mono tabular-nums text-neutral-100">{ssl.daysRemaining}j</strong> restants
                          </span>
                        </div>
                      ) : ssl.status === 'EXPIRING_SOON' ? (
                        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            <strong className="font-mono tabular-nums">{ssl.daysRemaining}j</strong> (Urgent)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>Expiré</span>
                        </div>
                      )}
                    </td>

                    {/* Health score */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {health ? (
                        <div className="inline-flex items-center gap-1">
                          <span
                            className={`font-mono font-semibold tabular-nums ${
                              health.healthScore >= 80
                                ? 'text-emerald-400'
                                : health.healthScore >= 60
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {health.healthScore}
                          </span>
                          <span className="text-neutral-400 text-xs">/100</span>
                          <span className="text-xs text-neutral-400 ml-1">
                            ({health.security.securityGrade})
                          </span>
                        </div>
                      ) : isAuditing ? (
                        <span className="text-xs text-emerald-400 animate-pulse">Audit en cours...</span>
                      ) : (
                        <span className="text-neutral-500 text-xs">Non audité</span>
                      )}
                    </td>

                    {/* Tracking */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {health ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          {health.tracking.totalTrackersFound > 0 ? (
                            <span className="text-neutral-300">
                              {[
                                health.tracking.hasGA4 ? 'GA4' : null,
                                health.tracking.hasGTM ? 'GTM' : null,
                                health.tracking.hasMetaPixel ? 'Pixel' : null
                              ].filter(Boolean).join(', ') || `${health.tracking.totalTrackersFound} actifs`}
                            </span>
                          ) : (
                            <span className="text-neutral-400">Aucun</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-500">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onQuickCheck(site.config.id)}
                          title="Ping Uptime & SSL immédiat"
                          className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 rounded-md transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeepAudit(site.config.id)}
                          title="Audit complet (SEO, Tracking, Sécurité)"
                          className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-cyan-400 rounded-md transition-colors"
                        >
                          <FileSearch className="w-3.5 h-3.5" />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === site.config.id ? null : site.config.id)}
                            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-md transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {actionMenuOpen === site.config.id && (
                            <div className="absolute right-0 top-8 z-20 w-36 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl py-1 text-xs">
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  onSelectSite(site);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-300"
                              >
                                Voir détails
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  onEditSite(site);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-300 flex items-center gap-1.5"
                              >
                                <Edit2 className="w-3 h-3 text-neutral-400" />
                                Modifier
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  onDeleteSite(site.config.id);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-rose-400 flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3 h-3" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
