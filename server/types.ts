export interface SiteConfig {
  id: string;
  name: string;
  url: string;
  category?: string;
  expectedStatus?: number;
  checkIntervalSeconds?: number;
  alertLatencyThresholdMs?: number;
  enabled: boolean;
  createdAt: string;
}

export interface UptimeResult {
  timestamp: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  statusCode: number | null;
  statusText: string;
  responseTimeMs: number;
  ipAddress?: string;
  redirectsCount: number;
  finalUrl?: string;
  contentLengthBytes?: number;
  errorMessage?: string;
}

export interface SSLResult {
  timestamp: string;
  valid: boolean;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  protocol?: string;
  cipher?: string;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'ERROR';
  errorMessage?: string;
}

export interface DNSResult {
  timestamp: string;
  resolved: boolean;
  ipv4: string[];
  ipv6: string[];
  nameservers: string[];
  mxRecords: string[];
  resolveTimeMs: number;
  errorMessage?: string;
}

export interface SEOAudit {
  hasTitle: boolean;
  title: string;
  titleLength: number;
  titleStatus: 'OPTIMAL' | 'TOO_SHORT' | 'TOO_LONG' | 'MISSING';
  hasDescription: boolean;
  description: string;
  descriptionLength: number;
  descriptionStatus: 'OPTIMAL' | 'TOO_SHORT' | 'TOO_LONG' | 'MISSING';
  hasH1: boolean;
  h1Count: number;
  h1Content: string;
  h1Status: 'OPTIMAL' | 'MULTIPLE' | 'MISSING';
  hasRobotsMeta: boolean;
  robotsMetaContent: string;
  isIndexable: boolean;
  hasCanonical: boolean;
  canonicalUrl: string;
  canonicalMatches: boolean;
  hasOpenGraph: boolean;
  ogTitle?: string;
  ogDescription?: string;
  hasRobotsTxt: boolean;
  robotsTxtHasSitemap: boolean;
  robotsTxtUrl: string;
}

export interface TrackingAudit {
  hasGA4: boolean;
  ga4Ids: string[];
  hasGTM: boolean;
  gtmIds: string[];
  hasMetaPixel: boolean;
  hasHotjar: boolean;
  hasMatomo: boolean;
  hasPlausible: boolean;
  totalTrackersFound: number;
}

export interface HeaderCheckItem {
  present: boolean;
  value?: string;
  score: number;
  recommendation: string;
}

export interface SecurityHeadersAudit {
  hsts: HeaderCheckItem;
  csp: HeaderCheckItem;
  xFrameOptions: HeaderCheckItem;
  xContentTypeOptions: HeaderCheckItem;
  referrerPolicy: HeaderCheckItem;
  permissionsPolicy: HeaderCheckItem;
  securityScore: number; // 0-100
  securityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface BrokenLinkCheck {
  url: string;
  statusCode: number | null;
  responseTimeMs: number;
  status: 'OK' | 'BROKEN' | 'TIMEOUT';
}

export interface HealthCheckResult {
  timestamp: string;
  healthScore: number; // 0 to 100
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  seo: SEOAudit;
  tracking: TrackingAudit;
  security: SecurityHeadersAudit;
  links: {
    totalChecked: number;
    brokenCount: number;
    testedLinks: BrokenLinkCheck[];
  };
  durationMs: number;
  errorMessage?: string;
}

export interface HistoryPoint {
  timestamp: string;
  responseTimeMs: number;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  statusCode: number | null;
}

export interface SiteFleetRecord {
  config: SiteConfig;
  lastUptime?: UptimeResult;
  lastSSL?: SSLResult;
  lastDNS?: DNSResult;
  lastHealth?: HealthCheckResult;
  uptimeHistory: HistoryPoint[];
  uptime24hPercent: number;
  isAuditing?: boolean;
}

export interface GlobalFleetKPIs {
  totalSites: number;
  activeSites: number;
  upCount: number;
  downCount: number;
  degradedCount: number;
  averageLatencyMs: number;
  globalUptimePercent: number;
  expiringSSLCertificatesCount: number;
  averageHealthScore: number;
  lastScanTime: string;
}
