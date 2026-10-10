import dns from 'dns';
import { URL } from 'url';
import type { DNSResult } from '../types.ts';

export async function checkDNS(targetUrl: string): Promise<DNSResult> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();

  let hostname: string;
  try {
    const parsed = new URL(targetUrl);
    hostname = parsed.hostname;
  } catch {
    return {
      timestamp,
      resolved: false,
      ipv4: [],
      ipv6: [],
      nameservers: [],
      mxRecords: [],
      resolveTimeMs: 0,
      errorMessage: 'URL invalide pour la résolution DNS'
    };
  }

  const dnsPromises = dns.promises;

  try {
    const [aRecords, aaaaRecords, nsRecords, mxRecords] = await Promise.allSettled([
      dnsPromises.resolve4(hostname),
      dnsPromises.resolve6(hostname),
      dnsPromises.resolveNs(hostname),
      dnsPromises.resolveMx(hostname)
    ]);

    const ipv4 = aRecords.status === 'fulfilled' ? aRecords.value : [];
    const ipv6 = aaaaRecords.status === 'fulfilled' ? aaaaRecords.value : [];
    const nameservers = nsRecords.status === 'fulfilled' ? nsRecords.value : [];
    const mx = mxRecords.status === 'fulfilled' 
      ? mxRecords.value.map(m => `${m.exchange} (prio: ${m.priority})`) 
      : [];

    const resolveTimeMs = Math.round(performance.now() - startTime);
    const resolved = ipv4.length > 0 || ipv6.length > 0;

    return {
      timestamp,
      resolved,
      ipv4,
      ipv6,
      nameservers,
      mxRecords: mx,
      resolveTimeMs,
      errorMessage: resolved ? undefined : 'Aucun enregistrement A/AAAA trouvé pour ce domaine'
    };
  } catch (error: any) {
    return {
      timestamp,
      resolved: false,
      ipv4: [],
      ipv6: [],
      nameservers: [],
      mxRecords: [],
      resolveTimeMs: Math.round(performance.now() - startTime),
      errorMessage: error.message || 'Échec de résolution DNS'
    };
  }
}
