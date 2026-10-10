import http from 'http';
import https from 'https';
import { URL } from 'url';
import { UptimeResult, SiteConfig } from '../types.js';

export async function checkUptime(site: SiteConfig): Promise<UptimeResult> {
  const targetUrl = site.url.trim();
  const startTime = performance.now();
  const alertThreshold = site.alertLatencyThresholdMs || 1500;
  const expectedStatus = site.expectedStatus || 200;

  try {
    const urlObj = new URL(targetUrl);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    return await new Promise<UptimeResult>((resolve) => {
      let redirectsCount = 0;

      function executeRequest(currentUrl: string) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(currentUrl);
        } catch {
          resolve({
            timestamp: new Date().toISOString(),
            status: 'DOWN',
            statusCode: null,
            statusText: 'URL invalide',
            responseTimeMs: Math.round(performance.now() - startTime),
            redirectsCount,
            errorMessage: 'Format d\'URL invalide'
          });
          return;
        }

        const isCurrentHttps = parsedUrl.protocol === 'https:';
        const reqClient = isCurrentHttps ? https : http;

        const req = reqClient.request(
          parsedUrl,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'WebFleet-UptimeProber/1.0 (+https://webfleet-monitor.local)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 10000,
            rejectUnauthorized: false // Allow probe to check even if cert has warnings so we capture the status
          },
          (res) => {
            const statusCode = res.statusCode || 0;
            const statusText = res.statusMessage || '';

            // Handle redirect
            if (
              [301, 302, 307, 308].includes(statusCode) &&
              res.headers.location &&
              redirectsCount < 5
            ) {
              redirectsCount++;
              let nextLocation = res.headers.location;
              if (!nextLocation.startsWith('http://') && !nextLocation.startsWith('https://')) {
                nextLocation = new URL(nextLocation, parsedUrl.origin).toString();
              }
              res.resume(); // consume response data to free up memory
              executeRequest(nextLocation);
              return;
            }

            let dataLength = 0;
            res.on('data', (chunk) => {
              dataLength += chunk.length;
            });

            res.on('end', () => {
              const latencyMs = Math.round(performance.now() - startTime);
              let status: 'UP' | 'DOWN' | 'DEGRADED' = 'UP';

              if (statusCode >= 400 || statusCode === 0) {
                status = 'DOWN';
              } else if (latencyMs > alertThreshold) {
                status = 'DEGRADED';
              } else if (expectedStatus && statusCode !== expectedStatus && statusCode >= 300) {
                status = 'DEGRADED';
              }

              resolve({
                timestamp: new Date().toISOString(),
                status,
                statusCode,
                statusText,
                responseTimeMs: latencyMs,
                ipAddress: res.socket?.remoteAddress,
                redirectsCount,
                finalUrl: parsedUrl.toString(),
                contentLengthBytes: dataLength || (res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : undefined)
              });
            });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          const latencyMs = Math.round(performance.now() - startTime);
          resolve({
            timestamp: new Date().toISOString(),
            status: 'DOWN',
            statusCode: 408,
            statusText: 'Request Timeout',
            responseTimeMs: latencyMs,
            redirectsCount,
            errorMessage: 'Délai d\'attente dépassé (timeout 10s)'
          });
        });

        req.on('error', (err: any) => {
          const latencyMs = Math.round(performance.now() - startTime);
          resolve({
            timestamp: new Date().toISOString(),
            status: 'DOWN',
            statusCode: null,
            statusText: err.code || 'Network Error',
            responseTimeMs: latencyMs,
            redirectsCount,
            errorMessage: err.message || 'Erreur réseau de connexion'
          });
        });

        req.end();
      }

      executeRequest(targetUrl);
    });
  } catch (error: any) {
    return {
      timestamp: new Date().toISOString(),
      status: 'DOWN',
      statusCode: null,
      statusText: 'Error',
      responseTimeMs: Math.round(performance.now() - startTime),
      redirectsCount: 0,
      errorMessage: error.message || 'Échec d\'analyse'
    };
  }
}
