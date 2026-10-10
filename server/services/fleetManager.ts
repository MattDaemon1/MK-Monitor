import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  SiteConfig,
  SiteFleetRecord,
  GlobalFleetKPIs,
  HistoryPoint
} from '../types.ts';
import { checkUptime } from './uptimeChecker.ts';
import { checkSSL } from './sslChecker.ts';
import { checkDNS } from './dnsChecker.ts';
import { runHealthAudit } from './healthAuditor.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const SITES_FILE = path.join(DATA_DIR, 'sites.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class FleetManager {
  private records: Map<string, SiteFleetRecord> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private checkIntervalSec = 60;
  private isCheckingAll = false;

  constructor() {
    this.loadSites();
  }

  private loadSites(): void {
    if (!fs.existsSync(SITES_FILE)) {
      return;
    }

    try {
      const content = fs.readFileSync(SITES_FILE, 'utf-8');
      const sites: SiteConfig[] = JSON.parse(content);
      
      // Load history if exists
      let historyMap: Record<string, HistoryPoint[]> = {};
      if (fs.existsSync(HISTORY_FILE)) {
        try {
          historyMap = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        } catch {
          historyMap = {};
        }
      }

      for (const site of sites) {
        this.records.set(site.id, {
          config: site,
          uptimeHistory: historyMap[site.id] || [],
          uptime24hPercent: 100
        });
      }
    } catch (err) {
      console.error('Erreur chargement sites.json:', err);
    }
  }

  public saveSites(): void {
    const list = Array.from(this.records.values()).map(r => r.config);
    fs.writeFileSync(SITES_FILE, JSON.stringify(list, null, 2), 'utf-8');
  }

  public saveHistory(): void {
    const historyMap: Record<string, HistoryPoint[]> = {};
    for (const [id, record] of this.records.entries()) {
      historyMap[id] = record.uptimeHistory.slice(-50); // Keep last 50 points
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyMap, null, 2), 'utf-8');
  }

  public getAll(): SiteFleetRecord[] {
    return Array.from(this.records.values());
  }

  public getById(id: string): SiteFleetRecord | undefined {
    return this.records.get(id);
  }

  public async addSite(data: Partial<SiteConfig>): Promise<SiteFleetRecord> {
    const id = 'site-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    let url = data.url?.trim() || '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const config: SiteConfig = {
      id,
      name: data.name?.trim() || new URL(url).hostname,
      url,
      category: data.category?.trim() || 'Général',
      expectedStatus: data.expectedStatus || 200,
      checkIntervalSeconds: data.checkIntervalSeconds || 60,
      alertLatencyThresholdMs: data.alertLatencyThresholdMs || 1500,
      enabled: data.enabled !== undefined ? data.enabled : true,
      createdAt: new Date().toISOString()
    };

    const record: SiteFleetRecord = {
      config,
      uptimeHistory: [],
      uptime24hPercent: 100
    };

    this.records.set(id, record);
    this.saveSites();

    // Trigger initial check & audit
    this.checkSite(id);
    this.auditSite(id);

    return record;
  }

  public updateSite(id: string, data: Partial<SiteConfig>): SiteFleetRecord | null {
    const record = this.records.get(id);
    if (!record) return null;

    let url = data.url ? data.url.trim() : record.config.url;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    record.config = {
      ...record.config,
      ...data,
      url,
      name: data.name ? data.name.trim() : record.config.name
    };

    this.saveSites();
    return record;
  }

  public deleteSite(id: string): boolean {
    const deleted = this.records.delete(id);
    if (deleted) {
      this.saveSites();
      this.saveHistory();
    }
    return deleted;
  }

  public async checkSite(id: string): Promise<SiteFleetRecord | null> {
    const record = this.records.get(id);
    if (!record) return null;

    try {
      const [uptime, ssl, dns] = await Promise.all([
        checkUptime(record.config),
        checkSSL(record.config.url),
        checkDNS(record.config.url)
      ]);

      record.lastUptime = uptime;
      record.lastSSL = ssl;
      record.lastDNS = dns;

      // Add to history
      const point: HistoryPoint = {
        timestamp: uptime.timestamp,
        responseTimeMs: uptime.responseTimeMs,
        status: uptime.status,
        statusCode: uptime.statusCode
      };

      record.uptimeHistory.push(point);
      if (record.uptimeHistory.length > 50) {
        record.uptimeHistory.shift();
      }

      // Compute uptime 24h %
      const total = record.uptimeHistory.length;
      if (total > 0) {
        const upCount = record.uptimeHistory.filter(h => h.status !== 'DOWN').length;
        record.uptime24hPercent = Math.round((upCount / total) * 100);
      }

      this.saveHistory();
      return record;
    } catch (err) {
      console.error(`Erreur lors du check de ${record.config.url}:`, err);
      return record;
    }
  }

  public async auditSite(id: string): Promise<SiteFleetRecord | null> {
    const record = this.records.get(id);
    if (!record) return null;

    record.isAuditing = true;
    try {
      const [uptime, ssl, health] = await Promise.all([
        checkUptime(record.config),
        checkSSL(record.config.url),
        runHealthAudit(record.config.url)
      ]);

      record.lastUptime = uptime;
      record.lastSSL = ssl;
      record.lastHealth = health;

      const point: HistoryPoint = {
        timestamp: uptime.timestamp,
        responseTimeMs: uptime.responseTimeMs,
        status: uptime.status,
        statusCode: uptime.statusCode
      };
      record.uptimeHistory.push(point);
      if (record.uptimeHistory.length > 50) {
        record.uptimeHistory.shift();
      }

      const total = record.uptimeHistory.length;
      if (total > 0) {
        const upCount = record.uptimeHistory.filter(h => h.status !== 'DOWN').length;
        record.uptime24hPercent = Math.round((upCount / total) * 100);
      }

      this.saveHistory();
    } catch (err) {
      console.error(`Erreur lors de l'audit de ${record.config.url}:`, err);
    } finally {
      record.isAuditing = false;
    }

    return record;
  }

  public async auditAll(): Promise<void> {
    if (this.isCheckingAll) return;
    this.isCheckingAll = true;

    try {
      const records = Array.from(this.records.values()).filter(r => r.config.enabled);
      // Run sequentially or batches of 3 to avoid socket congestion
      for (const record of records) {
        await this.auditSite(record.config.id);
      }
    } finally {
      this.isCheckingAll = false;
    }
  }

  public getGlobalKPIs(): GlobalFleetKPIs {
    const records = Array.from(this.records.values());
    const enabledRecords = records.filter(r => r.config.enabled);

    let upCount = 0;
    let downCount = 0;
    let degradedCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    let expiringSSLCertificatesCount = 0;
    let totalHealthScore = 0;
    let healthCount = 0;

    for (const r of enabledRecords) {
      if (r.lastUptime) {
        if (r.lastUptime.status === 'UP') upCount++;
        else if (r.lastUptime.status === 'DEGRADED') degradedCount++;
        else downCount++;

        totalLatency += r.lastUptime.responseTimeMs;
        latencyCount++;
      }

      if (r.lastSSL && r.lastSSL.status === 'EXPIRING_SOON') {
        expiringSSLCertificatesCount++;
      }

      if (r.lastHealth) {
        totalHealthScore += r.lastHealth.healthScore;
        healthCount++;
      }
    }

    const totalActive = enabledRecords.length;
    const globalUptimePercent = totalActive > 0 ? Math.round(((upCount + degradedCount) / Math.max(1, upCount + degradedCount + downCount)) * 100) : 100;
    const averageLatencyMs = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
    const averageHealthScore = healthCount > 0 ? Math.round(totalHealthScore / healthCount) : 0;

    return {
      totalSites: records.length,
      activeSites: totalActive,
      upCount,
      downCount,
      degradedCount,
      averageLatencyMs,
      globalUptimePercent,
      expiringSSLCertificatesCount,
      averageHealthScore,
      lastScanTime: new Date().toISOString()
    };
  }

  public startScheduler(intervalSeconds = 60): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.checkIntervalSec = intervalSeconds;
    if (intervalSeconds <= 0) return;

    this.timer = setInterval(async () => {
      const records = Array.from(this.records.values()).filter(r => r.config.enabled);
      for (const rec of records) {
        await this.checkSite(rec.config.id);
      }
    }, intervalSeconds * 1000);
  }

  public stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public resetToDefaults(): void {
    const defaultSites: SiteConfig[] = [
      {
        id: "site-mattkonnect",
        name: "Matt Konnect",
        url: "https://mattkonnect.com",
        category: "Agence & Production",
        expectedStatus: 200,
        checkIntervalSeconds: 60,
        alertLatencyThresholdMs: 1500,
        enabled: true,
        createdAt: new Date().toISOString()
      }
    ];

    this.records.clear();
    for (const s of defaultSites) {
      this.records.set(s.id, {
        config: s,
        uptimeHistory: [],
        uptime24hPercent: 100
      });
    }
    this.saveSites();
    this.saveHistory();
    this.auditAll();
  }

  public exportCSV(): string {
    const rows: string[] = [
      [
        'ID',
        'Nom',
        'URL',
        'Catégorie',
        'Statut Uptime',
        'Code HTTP',
        'Latence (ms)',
        'Score Santé /100',
        'Statut SSL',
        'Jours SSL restants',
        'Émetteur SSL',
        'SEO Title',
        'SEO Meta Description',
        'SEO H1',
        'Trackers Détectés',
        'Grade Sécurité',
        'Liens Cassés',
        'Dernière Vérification'
      ].join(';')
    ];

    for (const r of this.records.values()) {
      const row = [
        r.config.id,
        `"${(r.config.name || '').replace(/"/g, '""')}"`,
        `"${r.config.url}"`,
        `"${r.config.category || ''}"`,
        r.lastUptime?.status || 'NON_SCANNÉ',
        r.lastUptime?.statusCode || '',
        r.lastUptime?.responseTimeMs ?? '',
        r.lastHealth?.healthScore ?? '',
        r.lastSSL?.status || '',
        r.lastSSL?.daysRemaining ?? '',
        `"${(r.lastSSL?.issuer || '').replace(/"/g, '""')}"`,
        `"${(r.lastHealth?.seo.title || '').replace(/"/g, '""')}"`,
        `"${(r.lastHealth?.seo.description || '').replace(/"/g, '""')}"`,
        `"${(r.lastHealth?.seo.h1Content || '').replace(/"/g, '""')}"`,
        r.lastHealth?.tracking.totalTrackersFound ?? 0,
        r.lastHealth?.security.securityGrade || 'N/A',
        r.lastHealth?.links.brokenCount ?? 0,
        r.lastUptime?.timestamp || r.lastHealth?.timestamp || ''
      ];
      rows.push(row.join(';'));
    }

    return rows.join('\n');
  }
}

export const fleetManager = new FleetManager();
