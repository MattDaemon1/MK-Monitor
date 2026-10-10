import React, { useState } from 'react';
import { SiteFleetRecord } from '../types';
import {
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  FileSearch,
  Server,
  Layers,
  Lock,
  Link2
} from 'lucide-react';

interface SiteDetailModalProps {
  site: SiteFleetRecord;
  onClose: () => void;
  onRunAudit: (id: string) => void;
  onQuickCheck: (id: string) => void;
}

export const SiteDetailModal: React.FC<SiteDetailModalProps> = ({
  site,
  onClose,
  onRunAudit,
  onQuickCheck,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ssl' | 'seo' | 'tracking' | 'security' | 'links'>('overview');

  const uptime = site.lastUptime;
  const ssl = site.lastSSL;
  const dns = site.lastDNS;
  const health = site.lastHealth;
  const seo = health?.seo;
  const tracking = health?.tracking;
  const security = health?.security;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-start justify-between gap-4 bg-neutral-950/60">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white tracking-tight">{site.config.name}</h2>
              <a
                href={site.config.url}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-400 hover:text-emerald-400 inline-flex items-center gap-1 text-xs"
              >
                <span className="font-mono">{site.config.url}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1">
              <span>{site.config.category || 'Site web'}</span>
              <span aria-hidden="true">·</span>
              <span>Fréquence : <strong className="text-neutral-200">{(site.config.checkIntervalSeconds ?? 43200) >= 3600 ? `${Math.round((site.config.checkIntervalSeconds ?? 43200) / 3600)}h` : `${Math.round((site.config.checkIntervalSeconds ?? 43200) / 60)} min`}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Dernier audit : {uptime?.timestamp ? new Date(uptime.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}</span>
              <span aria-hidden="true">·</span>
              <span>Uptime : <strong className="font-mono text-emerald-400">{site.uptime24hPercent}%</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRunAudit(site.config.id)}
              disabled={site.isAuditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <FileSearch className={`w-3.5 h-3.5 ${site.isAuditing ? 'animate-spin' : ''}`} />
              <span>{site.isAuditing ? 'Audit en cours...' : 'Auditer maintenant'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-neutral-800 bg-neutral-950/30 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Uptime & Latence
          </button>
          <button
            onClick={() => setActiveTab('ssl')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'ssl'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Certificat SSL & DNS
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'seo'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            SEO On-Page & SERP
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tracking'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Tracking & Balises
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            En-têtes de Sécurité
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'links'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Liens Internes ({health?.links.brokenCount ? `${health.links.brokenCount} cassés` : '0 cassé'})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: OVERVIEW & UPTIME */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Uptime Status Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800">
                  <span className="text-neutral-400 uppercase tracking-wider text-[11px] block mb-1">Statut Actuel</span>
                  <div className="flex items-center gap-2">
                    {uptime?.status === 'UP' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-base font-semibold text-emerald-400">En Ligne (HTTP {uptime.statusCode})</span>
                      </>
                    ) : uptime?.status === 'DEGRADED' ? (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span className="text-base font-semibold text-amber-400">Dégradé / Lent (HTTP {uptime.statusCode})</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-400" />
                        <span className="text-base font-semibold text-rose-400">Hors Ligne (Erreur {uptime?.statusCode || 'Réseau'})</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800">
                  <span className="text-neutral-400 uppercase tracking-wider text-[11px] block mb-1">Temps de Réponse</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold font-mono text-white tabular-nums">
                      {uptime?.responseTimeMs || 0}
                    </span>
                    <span className="text-neutral-400">ms</span>
                    <span className="text-neutral-400 text-[11px] ml-auto">
                      Seuil alerte : {site.config.alertLatencyThresholdMs || 1500}ms
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800">
                  <span className="text-neutral-400 uppercase tracking-wider text-[11px] block mb-1">Score Global de Santé</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold font-mono text-emerald-400 tabular-nums">
                      {health?.healthScore ?? 'Non calculé'}
                    </span>
                    <span className="text-neutral-400">/100</span>
                    {health && (
                      <span className="text-neutral-400 text-[11px] ml-auto">
                        Grade Sécu : {health.security.securityGrade}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ping history bar visualizer */}
              <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-neutral-300">Historique récent des pings de latence</span>
                  <span className="text-neutral-400 font-mono text-[11px]">{site.uptimeHistory.length} vérifications enregistrées</span>
                </div>

                {site.uptimeHistory.length === 0 ? (
                  <p className="text-neutral-500 py-4 text-center">Aucun historique disponible pour le moment.</p>
                ) : (
                  <div>
                    <div className="flex items-end gap-1.5 h-20 pt-2 border-b border-neutral-800/80">
                      {site.uptimeHistory.map((pt, idx) => {
                        const heightPct = Math.min(100, Math.max(15, Math.round((pt.responseTimeMs / 1500) * 100)));
                        const colorClass =
                          pt.status === 'UP'
                            ? 'bg-emerald-500/80 hover:bg-emerald-400'
                            : pt.status === 'DEGRADED'
                            ? 'bg-amber-500/80 hover:bg-amber-400'
                            : 'bg-rose-500/80 hover:bg-rose-400';

                        return (
                          <div
                            key={idx}
                            style={{ height: `${heightPct}%` }}
                            className={`flex-1 rounded-t transition-all ${colorClass}`}
                            title={`${new Date(pt.timestamp).toLocaleTimeString()}: ${pt.responseTimeMs}ms (${pt.status})`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                      <span>Plus ancien</span>
                      <span>Dernier ping</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Network Details */}
              <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
                <span className="font-semibold text-neutral-300 block mb-2">Informations réseau détaillées</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-neutral-400">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Adresse IP Serveur</span>
                    <span className="font-mono text-neutral-200">{uptime?.ipAddress || 'Non résolue'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Redirections (Hops)</span>
                    <span className="font-mono text-neutral-200">{uptime?.redirectsCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Taille de réponse</span>
                    <span className="font-mono text-neutral-200">
                      {uptime?.contentLengthBytes ? `${Math.round(uptime.contentLengthBytes / 1024)} KB` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">URL Finale</span>
                    <span className="font-mono text-neutral-200 truncate block">{uptime?.finalUrl || site.config.url}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SSL & DNS */}
          {activeTab === 'ssl' && (
            <div className="space-y-6">
              {/* SSL Certificate Details */}
              <div className="p-5 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold text-base text-neutral-100">Certificat SSL / TLS</span>
                  </div>
                  {ssl && (
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-xs ${
                        ssl.status === 'VALID'
                          ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                          : ssl.status === 'EXPIRING_SOON'
                          ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                          : 'text-rose-400 bg-rose-950/40 border border-rose-800/40'
                      }`}
                    >
                      {ssl.status === 'VALID' ? 'Certificat Valide' : ssl.status === 'EXPIRING_SOON' ? 'Expire Bientôt' : 'Expiré / Invalide'}
                    </span>
                  )}
                </div>

                {!ssl ? (
                  <p className="text-neutral-500">Aucun scan SSL effectué.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 bg-neutral-900/50 p-3.5 rounded border border-neutral-800">
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase block">Autorité Émettrice (Issuer)</span>
                        <span className="font-medium text-neutral-200 text-sm">{ssl.issuer}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase block">Domaine Certifié (Subject)</span>
                        <span className="font-mono text-neutral-300">{ssl.subject}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase block">Protocole TLS & Chiffrement</span>
                        <span className="font-mono text-neutral-300">
                          {ssl.protocol || 'TLS'} · {ssl.cipher || 'Standard'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 bg-neutral-900/50 p-3.5 rounded border border-neutral-800">
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase block">Jours Restants</span>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-bold font-mono ${ssl.daysRemaining <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {ssl.daysRemaining}
                          </span>
                          <span className="text-neutral-400">jours avant expiration</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase block">Date d'émission</span>
                        <span className="font-mono text-neutral-300">
                          {ssl.validFrom ? new Date(ssl.validFrom).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase block">Date d'expiration</span>
                        <span className="font-mono text-neutral-300">
                          {ssl.validTo ? new Date(ssl.validTo).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DNS Resolution Details */}
              <div className="p-5 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-cyan-400" />
                    <span className="font-semibold text-base text-neutral-100">Résolution DNS & Enregistrements</span>
                  </div>
                  {dns && (
                    <span className="font-mono text-neutral-400 text-[11px]">
                      Temps de résolution : {dns.resolveTimeMs}ms
                    </span>
                  )}
                </div>

                {!dns ? (
                  <p className="text-neutral-500">Aucun scan DNS effectué.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-neutral-900/50 p-3.5 rounded border border-neutral-800 space-y-2">
                      <span className="text-neutral-400 text-[10px] uppercase block font-semibold">Enregistrements A (IPv4)</span>
                      {dns.ipv4.length > 0 ? (
                        <ul className="space-y-1 font-mono text-neutral-300">
                          {dns.ipv4.map((ip, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              {ip}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-neutral-500">Aucun enregistrement IPv4</span>
                      )}

                      <span className="text-neutral-400 text-[10px] uppercase block font-semibold pt-2">Enregistrements AAAA (IPv6)</span>
                      {dns.ipv6.length > 0 ? (
                        <ul className="space-y-1 font-mono text-neutral-300 truncate">
                          {dns.ipv6.map((ip, i) => (
                            <li key={i} className="truncate">{ip}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-neutral-500">Pas d'IPv6 configuré</span>
                      )}
                    </div>

                    <div className="bg-neutral-900/50 p-3.5 rounded border border-neutral-800 space-y-2">
                      <span className="text-neutral-400 text-[10px] uppercase block font-semibold">Serveurs de Noms (NS)</span>
                      {dns.nameservers.length > 0 ? (
                        <ul className="space-y-1 font-mono text-neutral-300">
                          {dns.nameservers.map((ns, i) => (
                            <li key={i}>{ns}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-neutral-500">Non renseigné</span>
                      )}

                      <span className="text-neutral-400 text-[10px] uppercase block font-semibold pt-2">Enregistrements MX (Mail)</span>
                      {dns.mxRecords.length > 0 ? (
                        <ul className="space-y-1 font-mono text-neutral-300">
                          {dns.mxRecords.slice(0, 3).map((mx, i) => (
                            <li key={i} className="truncate">{mx}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-neutral-500">Pas de serveurs de messagerie déclarés</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SEO ON-PAGE & SERP */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {!seo ? (
                <div className="p-8 text-center text-neutral-400">
                  <p className="mb-3">Aucun audit SEO n'a encore été réalisé pour ce site.</p>
                  <button
                    onClick={() => onRunAudit(site.config.id)}
                    className="px-4 py-2 bg-emerald-500 text-neutral-950 rounded-lg font-semibold"
                  >
                    Lancer l'audit SEO
                  </button>
                </div>
              ) : (
                <>
                  {/* Google SERP Preview Simulation */}
                  <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                    <span className="text-neutral-400 text-[11px] uppercase tracking-wider block font-semibold">
                      Aperçu dans les résultats de recherche Google (SERP)
                    </span>
                    <div className="p-4 rounded-lg bg-neutral-900/90 border border-neutral-800 font-sans max-w-2xl">
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mb-1 font-mono truncate">
                        <span>{site.config.url}</span>
                      </div>
                      <h4 className="text-base text-blue-400 hover:underline cursor-pointer font-medium mb-1">
                        {seo.title || 'Titre manquant'}
                      </h4>
                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                        {seo.description || 'Aucune balise meta description définie. Google utilisera un extrait arbitraire du corps de la page.'}
                      </p>
                    </div>
                  </div>

                  {/* Detailed SEO checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Balise Title */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">Balise &lt;title&gt;</span>
                        <span
                          className={`font-mono text-[11px] ${
                            seo.titleStatus === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {seo.titleLength} caractères (30-65 recommandé)
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {seo.title || <em className="text-rose-400">Aucun titre détecté</em>}
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">Meta Description</span>
                        <span
                          className={`font-mono text-[11px] ${
                            seo.descriptionStatus === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {seo.descriptionLength} caractères (70-160 recommandé)
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {seo.description || <em className="text-rose-400">Balise meta description absente</em>}
                      </div>
                    </div>

                    {/* Balise H1 */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">Titre Principal &lt;h1&gt;</span>
                        <span
                          className={`font-mono text-[11px] ${
                            seo.h1Status === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {seo.h1Count} H1 détecté(s) (1 recommandé)
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {seo.h1Content || <em className="text-rose-400">Aucun titre H1 présent</em>}
                      </div>
                    </div>

                    {/* Robots.txt & Indexabilité */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-3">
                      <span className="font-semibold text-neutral-200 block">Indexabilité & Robots</span>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Indexable par les moteurs :</span>
                          <span className={seo.isIndexable ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                            {seo.isIndexable ? 'Oui (index, follow)' : 'Non (noindex détecté)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Fichier robots.txt accessible :</span>
                          <span className={seo.hasRobotsTxt ? 'text-emerald-400' : 'text-neutral-500'}>
                            {seo.hasRobotsTxt ? 'Présent' : 'Non trouvé'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Sitemap déclaré dans robots.txt :</span>
                          <span className={seo.robotsTxtHasSitemap ? 'text-emerald-400' : 'text-neutral-500'}>
                            {seo.robotsTxtHasSitemap ? 'Oui' : 'Non'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">URL Canonique :</span>
                          <span className={seo.hasCanonical ? 'text-emerald-400 truncate max-w-[180px] font-mono' : 'text-neutral-500'}>
                            {seo.canonicalUrl || 'Non définie'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: TRACKING & BALISES */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              {!tracking ? (
                <div className="p-8 text-center text-neutral-400">
                  <p className="mb-3">Aucun scan de balises n'a encore été réalisé.</p>
                  <button
                    onClick={() => onRunAudit(site.config.id)}
                    className="px-4 py-2 bg-emerald-500 text-neutral-950 rounded-lg font-semibold"
                  >
                    Lancer l'audit
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800">
                    <span className="font-semibold text-neutral-200 text-sm block mb-1">
                      Synthèse des outils de tracking & tags analytics
                    </span>
                    <p className="text-neutral-400">
                      {tracking.totalTrackersFound > 0
                        ? `${tracking.totalTrackersFound} solution(s) de tracking détectée(s) sur la page d'accueil.`
                        : 'Aucun outil de suivi standard (Google Analytics, GTM, Pixel) n\'a été détecté dans le code source HTML.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Google Analytics 4 */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">Google Analytics 4 (GA4)</span>
                        <span className={tracking.hasGA4 ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                          {tracking.hasGA4 ? 'Détecté' : 'Non détecté'}
                        </span>
                      </div>
                      {tracking.ga4Ids.length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-neutral-400 text-[10px] uppercase">ID de mesure :</span>
                          <div className="flex flex-wrap gap-1">
                            {tracking.ga4Ids.map((id, i) => (
                              <span key={i} className="font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                                {id}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-neutral-500 text-[11px]">Aucun flux G-XXXXXXXX n'a été trouvé.</p>
                      )}
                    </div>

                    {/* Google Tag Manager */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">Google Tag Manager (GTM)</span>
                        <span className={tracking.hasGTM ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                          {tracking.hasGTM ? 'Détecté' : 'Non détecté'}
                        </span>
                      </div>
                      {tracking.gtmIds.length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-neutral-400 text-[10px] uppercase">Conteneur GTM :</span>
                          <div className="flex flex-wrap gap-1">
                            {tracking.gtmIds.map((id, i) => (
                              <span key={i} className="font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                                {id}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-neutral-500 text-[11px]">Aucun script GTM-XXXXXXX détecté.</p>
                      )}
                    </div>

                    {/* Meta Pixel */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
                      <span className="font-semibold text-neutral-200">Meta Pixel (Facebook)</span>
                      <span className={tracking.hasMetaPixel ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                        {tracking.hasMetaPixel ? 'Actif' : 'Non présent'}
                      </span>
                    </div>

                    {/* Hotjar / UX */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
                      <span className="font-semibold text-neutral-200">Hotjar (Cartes de chaleur)</span>
                      <span className={tracking.hasHotjar ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                        {tracking.hasHotjar ? 'Actif' : 'Non présent'}
                      </span>
                    </div>

                    {/* Matomo */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
                      <span className="font-semibold text-neutral-200">Matomo Analytics</span>
                      <span className={tracking.hasMatomo ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                        {tracking.hasMatomo ? 'Actif' : 'Non présent'}
                      </span>
                    </div>

                    {/* Plausible */}
                    <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
                      <span className="font-semibold text-neutral-200">Plausible Analytics (Privacy)</span>
                      <span className={tracking.hasPlausible ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                        {tracking.hasPlausible ? 'Actif' : 'Non présent'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY HEADERS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {!security ? (
                <div className="p-8 text-center text-neutral-400">
                  <p className="mb-3">Aucun audit de sécurité n'a encore été réalisé.</p>
                  <button
                    onClick={() => onRunAudit(site.config.id)}
                    className="px-4 py-2 bg-emerald-500 text-neutral-950 rounded-lg font-semibold"
                  >
                    Lancer l'audit
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-neutral-200 text-sm block">Grade de Sécurité HTTP</span>
                      <p className="text-neutral-400">Basé sur la présence des en-têtes défensifs de protection OWASP.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-bold text-emerald-400">{security.securityGrade}</span>
                      <span className="text-neutral-400 font-mono">({security.securityScore}/100)</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: 'Strict-Transport-Security (HSTS)', data: security.hsts, desc: 'Force les connexions HTTPS et protège contre le déclassement SSL.' },
                      { name: 'Content-Security-Policy (CSP)', data: security.csp, desc: 'Empêche les injections XSS en restreignant les sources de scripts.' },
                      { name: 'X-Frame-Options', data: security.xFrameOptions, desc: 'Empêche le détournement de clics (Clickjacking) via des iframes.' },
                      { name: 'X-Content-Type-Options', data: security.xContentTypeOptions, desc: 'Bloque le reniflage de type MIME malveillant (nosniff).' },
                      { name: 'Referrer-Policy', data: security.referrerPolicy, desc: 'Contrôle la transmission de l\'URL d\'origine lors des clics externes.' },
                      { name: 'Permissions-Policy', data: security.permissionsPolicy, desc: 'Restreint l\'accès aux APIs sensibles du navigateur (géolocalisation, caméra).' }
                    ].map((h, i) => (
                      <div key={i} className="p-3.5 rounded-lg bg-neutral-950/50 border border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-200">{h.name}</span>
                          <span className={h.data.present ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                            {h.data.present ? 'Actif' : 'Manquant'}
                          </span>
                        </div>
                        <p className="text-neutral-400 text-[11px]">{h.desc}</p>
                        {h.data.value && (
                          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-neutral-300 break-all">
                            {h.data.value}
                          </div>
                        )}
                        {!h.data.present && (
                          <div className="text-amber-300 text-[11px] font-mono">
                            Recommandation : {h.data.recommendation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 6: INTERNAL LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              {!health ? (
                <div className="p-8 text-center text-neutral-400">
                  <p className="mb-3">Aucun scan de liens internes n'a encore été réalisé.</p>
                  <button
                    onClick={() => onRunAudit(site.config.id)}
                    className="px-4 py-2 bg-emerald-500 text-neutral-950 rounded-lg font-semibold"
                  >
                    Lancer l'audit
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-neutral-200 text-sm block">Intégrité des Liens Internes</span>
                      <p className="text-neutral-400">Échantillonnage des liens trouvés sur la page pour détecter les erreurs 404.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-neutral-200">{health.links.totalChecked} vérifiés</span>
                      <span aria-hidden="true">·</span>
                      <span className={health.links.brokenCount > 0 ? 'text-rose-400 font-semibold font-mono' : 'text-emerald-400 font-semibold'}>
                        {health.links.brokenCount} cassé(s)
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 overflow-hidden bg-neutral-950/50">
                    {health.links.testedLinks.length === 0 ? (
                      <div className="p-4 text-center text-neutral-500">Aucun lien interne n'a été extrait de la page.</div>
                    ) : (
                      health.links.testedLinks.map((link, i) => (
                        <div key={i} className="p-3 flex items-center justify-between gap-4 text-xs hover:bg-neutral-900/40">
                          <div className="flex items-center gap-2 truncate">
                            <Link2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="font-mono text-neutral-300 truncate">{link.url}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-neutral-400 font-mono text-[11px]">{link.responseTimeMs}ms</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono ${
                                link.status === 'OK'
                                  ? 'text-emerald-400 bg-emerald-950/60'
                                  : 'text-rose-400 bg-rose-950/60 border border-rose-800/40'
                              }`}
                            >
                              {link.statusCode || link.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            ID: <span className="font-mono text-neutral-400">{site.config.id}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
