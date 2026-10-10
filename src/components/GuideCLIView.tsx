import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  FolderTree,
  Cpu,
  FileCode,
  ShieldCheck
} from 'lucide-react';

interface GuideCLIViewProps {
  onResetDefaults: () => void;
}

export const GuideCLIView: React.FC<GuideCLIViewProps> = ({ onResetDefaults }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copySnippet = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pythonCliSnippet = `# 1. Lancer le scan en CLI de tous les sites :
python3 cli/monitor.py

# 2. Scanner une URL spécifique :
python3 cli/monitor.py --url https://mon-site.com

# 3. Exporter directement le rapport d'audit en CSV :
python3 cli/monitor.py --export-csv rapport_audit.csv`;

  const nodeLaunchSnippet = `# 1. Installation des dépendances :
npm install

# 2. Lancement du serveur et du tableau de bord local :
npm run dev
# L'application est accessible sur http://localhost:3000

# 3. Ou exécution du script CLI direct sans interface web :
node cli/monitor.mjs`;

  const sitesJsonSnippet = `[
  {
    "id": "site-mattkonnect",
    "name": "Matt Konnect",
    "url": "https://mattkonnect.com",
    "category": "Agence & Production",
    "expectedStatus": 200,
    "checkIntervalSeconds": 60,
    "alertLatencyThresholdMs": 1500,
    "enabled": true
  }
]`;

  return (
    <div className="space-y-6 text-xs text-neutral-300">
      {/* Introduction Banner */}
      <div className="p-6 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Guide d'Architecture & Exécution Locale</h2>
            </div>
            <p className="text-neutral-400 text-xs max-w-3xl leading-relaxed">
              MK Monitor est conçu selon une architecture modulaire et performante, déployable sur AI Studio ou exécutable en local sur votre machine sans dépendance externe. Les vérifications réseau (sockets TLS, requêtes HTTP, DNS, parsing HTML) s'exécutent de façon fiable et sécurisée.
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('Voulez-vous réinitialiser la liste des sites avec les données de démonstration ?')) {
                onResetDefaults();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors border border-neutral-700 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Réinitialiser Démo</span>
          </button>
        </div>
      </div>

      {/* Architecture Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Technical Architecture */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">1. Architecture Technique Choisie</h3>
          </div>
          <ul className="space-y-2 text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">·</span>
              <span><strong>Backend Full-Stack :</strong> Node.js / Express avec TypeScript (`server.ts`). Gère le contournement des restrictions CORS du navigateur pour sonder réellement n'importe quel site web.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">·</span>
              <span><strong>Moteur de Sonde SSL/TLS :</strong> Connexions sockets TLS directes (`tls.connect`) avec extraction des certificats X.509, calcul d'échéance et détection de ciphers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">·</span>
              <span><strong>Health & SEO Auditor :</strong> Module d'analyse avec Cheerio pour le parsing DOM, les en-têtes HTTP de sécurité OWASP, les balises de tracking (GA4, GTM) et la détection des liens cassés 404.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">·</span>
              <span><strong>Dashboard :</strong> React 19 SPA avec Tailwind CSS v4, visualisations en direct et Dark Mode épuré.</span>
            </li>
          </ul>
        </div>

        {/* Directory Structure */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">2. Structure des Dossiers</h3>
          </div>
          <pre className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto">
{`mk-monitor/
├── data/
│   ├── sites.json       # Fichier maître des sites surveillés
│   └── history.json     # Historique des pings et latences
├── cli/
│   ├── monitor.py       # Script autonome Python (zéro dépendance)
│   └── monitor.mjs      # Script autonome Node.js
├── server/
│   ├── services/
│   │   ├── uptimeChecker.ts  # Mesure latence et HTTP code
│   │   ├── sslChecker.ts     # Sockets TLS & calcul expiration
│   │   ├── dnsChecker.ts     # Résolution A/AAAA/MX
│   │   ├── healthAuditor.ts  # SEO, Trackers, Headers de sécu
│   │   └── fleetManager.ts   # Planificateur et exports CSV/JSON
│   └── routes.ts             # API REST locale
├── src/                      # Interface React & Dashboard
├── requirements.txt          # Dépendances Python
├── requirements.json         # Spécifications de runtime
└── server.ts                 # Point d'entrée serveur`}
          </pre>
        </div>
      </div>

      {/* Step by Step Execution Guides */}
      <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">3. Lancement Local Pas-à-Pas</h3>
        </div>

        {/* Option A: Full-Stack Web Dashboard */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-200">
              Option A : Lancer le Tableau de Bord Full-Stack (Recommandé)
            </span>
            <button
              onClick={() => copySnippet('node', nodeLaunchSnippet)}
              className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
            >
              {copiedKey === 'node' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'node' ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
          <pre className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
            {nodeLaunchSnippet}
          </pre>
        </div>

        {/* Option B: Python CLI Script */}
        <div className="space-y-2 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-200">
              Option B : Script Python CLI Autonome (Idéal pour Tâches Cron ou Serveurs)
            </span>
            <button
              onClick={() => copySnippet('python', pythonCliSnippet)}
              className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
            >
              {copiedKey === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'python' ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
          <pre className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-cyan-400 overflow-x-auto">
            {pythonCliSnippet}
          </pre>
        </div>
      </div>

      {/* sites.json Configuration Reference */}
      <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">4. Configuration de vos Sites dans data/sites.json</h3>
          </div>
          <button
            onClick={() => copySnippet('json', sitesJsonSnippet)}
            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
          >
            {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'json' ? 'Copié !' : 'Copier'}</span>
          </button>
        </div>
        <p className="text-neutral-400 text-xs">
          Vous pouvez ajouter vos sites directement depuis l'interface via le bouton "+ Ajouter un site", ou modifier le fichier <code className="text-neutral-200 font-mono">data/sites.json</code> manuellement :
        </p>
        <pre className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto">
          {sitesJsonSnippet}
        </pre>
      </div>
    </div>
  );
};
