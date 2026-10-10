import React from 'react';
import { GlobalFleetKPIs } from '../types';
import { Activity, ShieldAlert, Zap, Globe, HeartPulse } from 'lucide-react';

interface KPIGridProps {
  kpis: GlobalFleetKPIs | null;
  onFilterAlerts: () => void;
  onFilterExpiringSSL: () => void;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
  onFilterAlerts,
  onFilterExpiringSSL,
}) => {
  if (!kpis) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-neutral-900/40 border border-neutral-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const hasIncidents = kpis.downCount > 0 || kpis.degradedCount > 0;
  const hasExpiringSSL = kpis.expiringSSLCertificatesCount > 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {/* 1. Sites surveillés */}
      <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Parc Surveillé</span>
          <Globe className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white font-mono tabular-nums">
            {kpis.totalSites}
          </span>
          <span className="text-xs text-neutral-400">
            {kpis.activeSites} actifs
          </span>
        </div>
      </div>

      {/* 2. Disponibilité Globale */}
      <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Disponibilité</span>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-semibold font-mono tabular-nums ${kpis.globalUptimePercent >= 99 ? 'text-emerald-400' : kpis.globalUptimePercent >= 95 ? 'text-amber-400' : 'text-rose-400'}`}>
            {kpis.globalUptimePercent}%
          </span>
          <span className="text-xs text-neutral-400">
            {kpis.upCount} UP · {kpis.downCount} DOWN
          </span>
        </div>
      </div>

      {/* 3. Latence Moyenne */}
      <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Latence Moyenne</span>
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white font-mono tabular-nums">
            {kpis.averageLatencyMs}
          </span>
          <span className="text-xs text-neutral-400 font-mono">ms</span>
        </div>
      </div>

      {/* 4. Certificats SSL */}
      <div
        onClick={hasExpiringSSL ? onFilterExpiringSSL : undefined}
        className={`p-4 rounded-lg bg-neutral-900/60 border transition-all ${
          hasExpiringSSL
            ? 'border-amber-500/40 bg-amber-950/20 cursor-pointer hover:border-amber-400/60'
            : 'border-neutral-800/80'
        }`}
      >
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">SSL &lt; 30 Jours</span>
          <ShieldAlert className={`w-4 h-4 ${hasExpiringSSL ? 'text-amber-400' : 'text-neutral-400'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-semibold font-mono tabular-nums ${hasExpiringSSL ? 'text-amber-400' : 'text-emerald-400'}`}>
            {kpis.expiringSSLCertificatesCount}
          </span>
          <span className="text-xs text-neutral-400">
            {hasExpiringSSL ? 'renouvellement requis' : 'tous valides'}
          </span>
        </div>
      </div>

      {/* 5. Score Santé Moyen */}
      <div
        onClick={hasIncidents ? onFilterAlerts : undefined}
        className={`p-4 rounded-lg bg-neutral-900/60 border transition-all ${
          hasIncidents
            ? 'border-rose-500/30 bg-rose-950/10 cursor-pointer hover:border-rose-400/50'
            : 'border-neutral-800/80'
        }`}
      >
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Score Santé Moyen</span>
          <HeartPulse className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-semibold font-mono tabular-nums ${
            kpis.averageHealthScore >= 80 ? 'text-emerald-400' : kpis.averageHealthScore >= 60 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {kpis.averageHealthScore}
          </span>
          <span className="text-xs text-neutral-400 font-mono">/100</span>
        </div>
      </div>
    </div>
  );
};
