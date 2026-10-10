#!/usr/bin/env node
/**
 * WebFleet Monitor - Standalone Node.js CLI
 * Lanceable avec : node cli/monitor.mjs
 */

import https from 'https';
import http from 'http';
import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkSite(targetUrl) {
  const start = performance.now();
  const parsed = new URL(targetUrl);
  const client = parsed.protocol === 'https:' ? https : http;

  return new Promise((resolve) => {
    const req = client.request(parsed, { method: 'GET', timeout: 8000, rejectUnauthorized: false }, (res) => {
      const latency = Math.round(performance.now() - start);
      let body = '';
      res.on('data', chunk => { if (body.length < 100000) body += chunk; });
      res.on('end', () => {
        const titleMatch = body.match(/<title[^>]*>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'Sans titre';
        const hasGA4 = /G-[A-Z0-9]{5,14}/i.test(body);
        const hasGTM = /GTM-[A-Z0-9]{4,12}/i.test(body);
        resolve({
          url: targetUrl,
          statusCode: res.statusCode,
          latencyMs: latency,
          status: res.statusCode === 200 ? 'UP' : 'DEGRADED',
          title,
          trackers: [hasGA4 ? 'GA4' : null, hasGTM ? 'GTM' : null].filter(Boolean)
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        url: targetUrl,
        statusCode: null,
        latencyMs: Math.round(performance.now() - start),
        status: 'DOWN',
        title: '',
        trackers: [],
        error: err.message
      });
    });

    req.end();
  });
}

async function main() {
  const sitesPath = path.resolve(__dirname, '../data/sites.json');
  let sites = [
    { url: 'https://www.wikipedia.org' },
    { url: 'https://github.com' },
    { url: 'https://example.com' }
  ];

  if (fs.existsSync(sitesPath)) {
    try {
      sites = JSON.parse(fs.readFileSync(sitesPath, 'utf8'));
    } catch {}
  }

  console.log(`\n🚀 MK MONITOR CLI (Matt Konnect)`);
  console.log(`Auditing ${sites.length} sites...\n`);

  for (const s of sites) {
    const res = await checkSite(s.url);
    const color = res.status === 'UP' ? '\x1b[32m' : '\x1b[31m';
    console.log(`  ${color}[${res.status} ${res.statusCode || 'ERR'}]\x1b[0m ${s.url} (${res.latencyMs}ms) - Title: "${res.title.slice(0, 40)}" - Trackers: ${res.trackers.join(', ') || 'aucun'}`);
  }
  console.log('\n✅ Audit terminé.\n');
}

main();
