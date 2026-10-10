import React from 'react';
import { RefreshCw } from 'lucide-react';

interface TopBarProps {
  currentTab: 'overview' | 'sites' | 'reports' | 'guide';
  onSelectTab: (tab: 'overview' | 'sites' | 'reports' | 'guide') => void;
  onScanAll: () => void;
  isScanning: boolean;
  totalSites: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onScanAll,
  isScanning,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm tracking-tight">
            MK
          </div>
          <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
            MK Monitor
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => onSelectTab('overview')}
            className={`whitespace-nowrap py-1 transition-colors ${
              currentTab === 'overview'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => onSelectTab('sites')}
            className={`whitespace-nowrap py-1 transition-colors ${
              currentTab === 'sites'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sites surveillés
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className={`whitespace-nowrap py-1 transition-colors ${
              currentTab === 'reports'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Rapports & Exports
          </button>
          <button
            onClick={() => onSelectTab('guide')}
            className={`whitespace-nowrap py-1 transition-colors ${
              currentTab === 'guide'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Guide & Script CLI
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onScanAll}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-neutral-950 hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-60 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scan en cours...' : 'Scanner le parc'}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-800/60 px-2 py-2 bg-neutral-950 text-xs">
        <button
          onClick={() => onSelectTab('overview')}
          className={`px-2 py-1 ${currentTab === 'overview' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => onSelectTab('sites')}
          className={`px-2 py-1 ${currentTab === 'sites' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}`}
        >
          Sites
        </button>
        <button
          onClick={() => onSelectTab('reports')}
          className={`px-2 py-1 ${currentTab === 'reports' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}`}
        >
          Rapports
        </button>
        <button
          onClick={() => onSelectTab('guide')}
          className={`px-2 py-1 ${currentTab === 'guide' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}`}
        >
          Guide & CLI
        </button>
      </div>
    </header>
  );
};
