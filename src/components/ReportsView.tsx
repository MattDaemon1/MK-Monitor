import React, { useState } from 'react';
import { SiteFleetRecord, GlobalFleetKPIs } from '../types';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Copy,
  Printer,
  Check,
  ShieldAlert,
  Activity,
  AlertCircle
} from 'lucide-react';

interface ReportsViewProps {
  sites: SiteFleetRecord[];
  kpis: GlobalFleetKPIs | null;
  token?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ sites, kpis, token }) => {
  const [copied, setCopied] = useState(false);

  const expiringSslSites = sites.filter((s) => s.lastSSL && s.lastSSL.status === 'EXPIRING_SOON');
  const downSites = sites.filter((s) => s.lastUptime && s.lastUptime.status === 'DOWN');
  const degradedSites = sites.filter((s) => s.lastUptime && s.lastUptime.status === 'DEGRADED');

  const generateMarkdownReport = () => {
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let md = `# RAPPORT DE SANTÉ & DISPONIBILITÉ DU PARC WEB\n`;
    md += `**Date de génération :** ${dateStr}\n`;
    md += `**Outil :** MK Monitor (Matt Konnect · Audit Automatisé)\n\n`;

    md += `## 1. SYNTHÈSE EXÉCUTIVE DES INDICATEURS CLÉS\n`;
    md += `- **Nombre total de sites surveillés :** ${kpis?.totalSites || sites.length}\n`;
    md += `- **Taux de disponibilité global :** ${kpis?.globalUptimePercent || 100}%\n`;
    md += `- **Temps de réponse moyen (latence) :** ${kpis?.averageLatencyMs || 0} ms\n`;
    md += `- **Certificats SSL arrivant à expiration (< 30 jours) :** ${expiringSslSites.length}\n`;
    md += `- **Score moyen de santé technique :** ${kpis?.averageHealthScore || 0}/100\n\n`;

    if (downSites.length > 0) {
      md += `## 2. INCIDENTS CRITIQUES (SITES HORS LIGNE)\n`;
      downSites.forEach((s) => {
        md += `- ❌ **${s.config.name}** (${s.config.url}) : Statut HTTP ${s.lastUptime?.statusCode || 'Erreur'}, Erreur : ${s.lastUptime?.errorMessage || 'Non joignable'}\n`;
      });
      md += `\n`;
    }

    if (expiringSslSites.length > 0) {
      md += `## 3. CERTIFICATS SSL À RENOUVELER D'URGENCE\n`;
      expiringSslSites.forEach((s) => {
        md += `- ⚠️ **${s.config.name}** : expire dans **${s.lastSSL?.daysRemaining} jours** (Émetteur : ${s.lastSSL?.issuer})\n`;
      });
      md += `\n`;
    }

    md += `## 4. DÉTAIL PAR SITE DU PARC\n\n`;
    md += `| Site | Statut | Latence | SSL (jours) | Score Santé | Trackers |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    sites.forEach((s) => {
      const st = s.lastUptime?.status || 'N/A';
      const lat = s.lastUptime ? `${s.lastUptime.responseTimeMs}ms` : '-';
      const sslDays = s.lastSSL ? `${s.lastSSL.daysRemaining}j` : '-';
      const health = s.lastHealth ? `${s.lastHealth.healthScore}/100` : '-';
      const trackers = s.lastHealth?.tracking.totalTrackersFound || 0;
      md += `| ${s.config.name} | ${st} | ${lat} | ${sslDays} | ${health} | ${trackers} |\n`;
    });

    md += `\n---\n*Rapport généré automatiquement par MK Monitor (Matt Konnect).*`;
    return md;
  };

  const handleCopyMarkdown = () => {
    const text = generateMarkdownReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* JSON Export */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white text-sm">Export Données Brutes (JSON)</h3>
            </div>
            <p className="text-neutral-400 text-xs mb-4">
              Téléchargez l'intégralité des configurations, résultats d'uptime, certificats SSL, DNS et audits SEO/sécurité sous forme de fichier JSON structuré pour vos pipelines ou sauvegardes.
            </p>
          </div>
          <a
            href={`/api/export/json${token ? `?token=${encodeURIComponent(token)}` : ''}`}
            download
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-semibold transition-colors border border-neutral-700/80 w-fit"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Télécharger le JSON (.json)</span>
          </a>
        </div>

        {/* CSV Export */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">Rapport Tableur (CSV)</h3>
            </div>
            <p className="text-neutral-400 text-xs mb-4">
              Générez un tableau récapitulatif complet encodé en UTF-8 (compatible Microsoft Excel, LibreOffice et Google Sheets) pour analyser les métriques ou facturer vos prestations de maintenance.
            </p>
          </div>
          <a
            href={`/api/export/csv${token ? `?token=${encodeURIComponent(token)}` : ''}`}
            download
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-semibold transition-colors border border-neutral-700/80 w-fit"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Télécharger le CSV (.csv)</span>
          </a>
        </div>
      </div>

      {/* Executive Summary View */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg overflow-hidden">
        {/* Header toolbar */}
        <div className="p-4 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/40">
          <div>
            <h3 className="font-semibold text-white text-sm">Synthèse Exécutive pour Clients & Parties Prenantes</h3>
            <p className="text-neutral-400 text-xs mt-0.5">
              Rapport récapitulatif formaté, prêt à être copié dans un e-mail ou imprimé.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors border border-neutral-700/80"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié en Markdown !' : 'Copier en Markdown'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors border border-neutral-700/80"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer le rapport</span>
            </button>
          </div>
        </div>

        {/* Formatted printable document */}
        <div className="p-6 md:p-8 space-y-6 text-xs bg-neutral-950/70">
          {/* Document Title */}
          <div className="border-b border-neutral-800 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider block">
                  MK Monitor · Audit Technique
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                  Bilan Périodique de Disponibilité & Santé du Parc Web
                </h2>
              </div>
              <div className="text-right text-neutral-400 text-xs">
                <span>Date d'évaluation : </span>
                <strong className="text-neutral-200">
                  {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </div>
            </div>
          </div>

          {/* Key Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 uppercase text-[10px] block">Disponibilité Globale</span>
              <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {kpis?.globalUptimePercent || 100}%
              </span>
            </div>
            <div className="p-3.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 uppercase text-[10px] block">Temps de Réponse Moyen</span>
              <span className="text-xl font-bold font-mono text-neutral-100 tabular-nums">
                {kpis?.averageLatencyMs || 0} ms
              </span>
            </div>
            <div className="p-3.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 uppercase text-[10px] block">Certificats SSL &lt; 30j</span>
              <span className={`text-xl font-bold font-mono tabular-nums ${expiringSslSites.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {expiringSslSites.length}
              </span>
            </div>
            <div className="p-3.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 uppercase text-[10px] block">Score Santé Moyen</span>
              <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {kpis?.averageHealthScore || 0}/100
              </span>
            </div>
          </div>

          {/* Action alerts if any */}
          {downSites.length > 0 && (
            <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/40 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Intervention Immédiate Requise : Sites Indisponibles</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-1">
                {downSites.map((s) => (
                  <li key={s.config.id}>
                    <strong>{s.config.name}</strong> ({s.config.url}) : Code {s.lastUptime?.statusCode || 'Erreur'} ({s.lastUptime?.errorMessage || 'Connexion refusée'})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {expiringSslSites.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>Renouvellement SSL à planifier (&lt; 30 jours)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-1">
                {expiringSslSites.map((s) => (
                  <li key={s.config.id}>
                    <strong>{s.config.name}</strong> : expiration dans{' '}
                    <strong className="text-amber-300 font-mono">{s.lastSSL?.daysRemaining} jours</strong> (Émis par {s.lastSSL?.issuer})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary Fleet Table */}
          <div className="space-y-2">
            <h4 className="font-semibold text-neutral-200 text-sm">Tableau de synthèse par site</h4>
            <div className="overflow-x-auto border border-neutral-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800 font-medium">
                    <th className="py-2.5 px-3">Site</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3 text-right">Latence</th>
                    <th className="py-2.5 px-3">SSL Expire dans</th>
                    <th className="py-2.5 px-3 text-center">Score Santé</th>
                    <th className="py-2.5 px-3">Sécurité HTTP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  {sites.map((s) => (
                    <tr key={s.config.id} className="hover:bg-neutral-900/40">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-white">{s.config.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono truncate max-w-[200px]">{s.config.url}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={s.lastUptime?.status === 'UP' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                          {s.lastUptime?.status || 'N/A'} ({s.lastUptime?.statusCode || 'ERR'})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {s.lastUptime?.responseTimeMs} ms
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">
                        {s.lastSSL?.daysRemaining !== undefined ? `${s.lastSSL.daysRemaining} jours` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                        {s.lastHealth ? `${s.lastHealth.healthScore}/100` : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        {s.lastHealth?.security ? (
                          <span className="font-semibold text-neutral-200">
                            Grade {s.lastHealth.security.securityGrade} ({s.lastHealth.security.securityScore}%)
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
