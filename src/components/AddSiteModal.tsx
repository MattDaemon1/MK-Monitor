import React, { useState, useEffect } from 'react';
import { SiteConfig, SiteFleetRecord } from '../types';
import { X, Globe, Tag, Clock, Zap, CheckCircle2 } from 'lucide-react';

interface AddSiteModalProps {
  initialSite?: SiteFleetRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (siteData: Partial<SiteConfig>) => Promise<void>;
}

export const AddSiteModal: React.FC<AddSiteModalProps> = ({
  initialSite,
  isOpen,
  onClose,
  onSave,
}) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Production');
  const [checkIntervalSeconds, setCheckIntervalSeconds] = useState(60);
  const [alertLatencyThresholdMs, setAlertLatencyThresholdMs] = useState(1500);
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSite) {
      setUrl(initialSite.config.url);
      setName(initialSite.config.name);
      setCategory(initialSite.config.category || 'Production');
      setCheckIntervalSeconds(initialSite.config.checkIntervalSeconds || 60);
      setAlertLatencyThresholdMs(initialSite.config.alertLatencyThresholdMs || 1500);
      setExpectedStatus(initialSite.config.expectedStatus || 200);
    } else {
      setUrl('');
      setName('');
      setCategory('Production');
      setCheckIntervalSeconds(60);
      setAlertLatencyThresholdMs(1500);
      setExpectedStatus(200);
    }
    setError(null);
  }, [initialSite, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Veuillez renseigner une adresse de site web.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setError('Format d\'URL invalide. Exemple: https://mon-domaine.fr');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        url: cleanUrl,
        name: name.trim() || undefined,
        category: category.trim(),
        checkIntervalSeconds: Number(checkIntervalSeconds),
        alertLatencyThresholdMs: Number(alertLatencyThresholdMs),
        expectedStatus: Number(expectedStatus)
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">
              {initialSite ? 'Modifier le site surveillé' : 'Ajouter un site à surveiller'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              URL du site web <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://mon-site-client.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 font-mono focus:outline-none focus:border-emerald-500/60"
            />
            <span className="text-neutral-400 text-[11px] mt-1 block">
              Si vous omettez https://, le préfixe sera ajouté automatiquement.
            </span>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Nom d'affichage (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Boutique Principale, Portail Client"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                Catégorie / Tag
              </label>
              <input
                type="text"
                placeholder="Ex: Client VIP, E-commerce, SaaS"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                Code HTTP attendu
              </label>
              <input
                type="number"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 font-mono focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                Intervalle de contrôle
              </label>
              <select
                value={checkIntervalSeconds}
                onChange={(e) => setCheckIntervalSeconds(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500/60"
              >
                <option value={30}>30 secondes</option>
                <option value={60}>1 minute (Recommandé)</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                Seuil d'alerte latence
              </label>
              <select
                value={alertLatencyThresholdMs}
                onChange={(e) => setAlertLatencyThresholdMs(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500/60"
              >
                <option value={800}>800 ms (Strict)</option>
                <option value={1500}>1500 ms (Standard)</option>
                <option value={2500}>2500 ms (Tolérant)</option>
                <option value={4000}>4000 ms (Large)</option>
              </select>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg font-semibold transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : initialSite ? 'Mettre à jour' : 'Ajouter le site'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
