import * as cheerio from 'cheerio';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import {
  HealthCheckResult,
  SEOAudit,
  TrackingAudit,
  SecurityHeadersAudit,
  BrokenLinkCheck,
  HeaderCheckItem
} from '../types.js';

// Helper to fetch HTML and response headers with timeout and redirects
async function fetchPage(targetUrl: string, maxRedirects = 4): Promise<{ html: string; headers: Record<string, string>; finalUrl: string; statusCode: number }> {
  return new Promise((resolve, reject) => {
    let redirectsCount = 0;

    function execute(currentUrl: string) {
      let parsed: URL;
      try {
        parsed = new URL(currentUrl);
      } catch (err) {
        return reject(new Error('URL invalide'));
      }

      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(
        parsed,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WebFleetAuditor/1.0; +https://webfleet-monitor.local)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
          },
          timeout: 9000,
          rejectUnauthorized: false
        },
        (res) => {
          const statusCode = res.statusCode || 0;
          if ([301, 302, 307, 308].includes(statusCode) && res.headers.location && redirectsCount < maxRedirects) {
            redirectsCount++;
            let nextLoc = res.headers.location;
            if (!nextLoc.startsWith('http://') && !nextLoc.startsWith('https://')) {
              nextLoc = new URL(nextLoc, parsed.origin).toString();
            }
            res.resume();
            return execute(nextLoc);
          }

          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            if (body.length < 500000) { // Limit to 500KB to avoid heavy pages overloading
              body += chunk;
            }
          });

          res.on('end', () => {
            const normalizedHeaders: Record<string, string> = {};
            for (const [key, val] of Object.entries(res.headers)) {
              if (val) {
                normalizedHeaders[key.toLowerCase()] = Array.isArray(val) ? val.join('; ') : val;
              }
            }
            resolve({
              html: body,
              headers: normalizedHeaders,
              finalUrl: parsed.toString(),
              statusCode
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Délai d\'attente dépassé (timeout)'));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    }

    execute(targetUrl);
  });
}

// Fast head/get check for a link
async function checkLink(targetUrl: string): Promise<BrokenLinkCheck> {
  const startTime = performance.now();
  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(
        parsed,
        {
          method: 'HEAD',
          headers: {
            'User-Agent': 'WebFleetAuditor/1.0'
          },
          timeout: 4000,
          rejectUnauthorized: false
        },
        (res) => {
          const latency = Math.round(performance.now() - startTime);
          const code = res.statusCode || 0;
          res.resume();
          resolve({
            url: targetUrl,
            statusCode: code,
            responseTimeMs: latency,
            status: code >= 400 || code === 0 ? 'BROKEN' : 'OK'
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url: targetUrl,
          statusCode: 408,
          responseTimeMs: Math.round(performance.now() - startTime),
          status: 'TIMEOUT'
        });
      });

      req.on('error', () => {
        resolve({
          url: targetUrl,
          statusCode: null,
          responseTimeMs: Math.round(performance.now() - startTime),
          status: 'BROKEN'
        });
      });

      req.end();
    } catch {
      resolve({
        url: targetUrl,
        statusCode: null,
        responseTimeMs: Math.round(performance.now() - startTime),
        status: 'BROKEN'
      });
    }
  });
}

// Check robots.txt
async function checkRobotsTxt(origin: string): Promise<{ hasRobotsTxt: boolean; hasSitemap: boolean; robotsTxtUrl: string }> {
  const robotsUrl = `${origin.replace(/\/+$/, '')}/robots.txt`;
  try {
    const res = await fetchPage(robotsUrl, 2);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const text = res.html.toLowerCase();
      const hasSitemap = text.includes('sitemap:');
      return { hasRobotsTxt: true, hasSitemap, robotsTxtUrl: robotsUrl };
    }
  } catch {
    // Ignore error
  }
  return { hasRobotsTxt: false, hasSitemap: false, robotsTxtUrl: robotsUrl };
}

export async function runHealthAudit(siteUrl: string): Promise<HealthCheckResult> {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  let pageData: { html: string; headers: Record<string, string>; finalUrl: string; statusCode: number };
  try {
    pageData = await fetchPage(siteUrl);
  } catch (error: any) {
    return {
      timestamp,
      healthScore: 0,
      healthStatus: 'CRITICAL',
      seo: {
        hasTitle: false,
        title: '',
        titleLength: 0,
        titleStatus: 'MISSING',
        hasDescription: false,
        description: '',
        descriptionLength: 0,
        descriptionStatus: 'MISSING',
        hasH1: false,
        h1Count: 0,
        h1Content: '',
        h1Status: 'MISSING',
        hasRobotsMeta: false,
        robotsMetaContent: '',
        isIndexable: false,
        hasCanonical: false,
        canonicalUrl: '',
        canonicalMatches: false,
        hasOpenGraph: false,
        hasRobotsTxt: false,
        robotsTxtHasSitemap: false,
        robotsTxtUrl: `${siteUrl}/robots.txt`
      },
      tracking: {
        hasGA4: false,
        ga4Ids: [],
        hasGTM: false,
        gtmIds: [],
        hasMetaPixel: false,
        hasHotjar: false,
        hasMatomo: false,
        hasPlausible: false,
        totalTrackersFound: 0
      },
      security: {
        hsts: { present: false, score: 0, recommendation: 'Activer HTTP Strict Transport Security' },
        csp: { present: false, score: 0, recommendation: 'Définir une Content Security Policy' },
        xFrameOptions: { present: false, score: 0, recommendation: 'Configurer X-Frame-Options: SAMEORIGIN' },
        xContentTypeOptions: { present: false, score: 0, recommendation: 'Ajouter X-Content-Type-Options: nosniff' },
        referrerPolicy: { present: false, score: 0, recommendation: 'Configurer Referrer-Policy' },
        permissionsPolicy: { present: false, score: 0, recommendation: 'Restreindre les fonctionnalités avec Permissions-Policy' },
        securityScore: 0,
        securityGrade: 'F'
      },
      links: {
        totalChecked: 0,
        brokenCount: 0,
        testedLinks: []
      },
      durationMs: Math.round(performance.now() - startTime),
      errorMessage: error.message || 'Impossible d\'accéder à la page pour l\'audit'
    };
  }

  const { html, headers, finalUrl } = pageData;
  const $ = cheerio.load(html);
  const parsedFinalUrl = new URL(finalUrl);

  // 1. SEO AUDIT
  const rawTitle = $('title').first().text().trim();
  const titleLength = rawTitle.length;
  let titleStatus: 'OPTIMAL' | 'TOO_SHORT' | 'TOO_LONG' | 'MISSING' = 'MISSING';
  if (titleLength > 0) {
    if (titleLength >= 30 && titleLength <= 65) titleStatus = 'OPTIMAL';
    else if (titleLength < 30) titleStatus = 'TOO_SHORT';
    else titleStatus = 'TOO_LONG';
  }

  const metaDesc = (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''
  ).trim();
  const descLength = metaDesc.length;
  let descriptionStatus: 'OPTIMAL' | 'TOO_SHORT' | 'TOO_LONG' | 'MISSING' = 'MISSING';
  if (descLength > 0) {
    if (descLength >= 70 && descLength <= 165) descriptionStatus = 'OPTIMAL';
    else if (descLength < 70) descriptionStatus = 'TOO_SHORT';
    else descriptionStatus = 'TOO_LONG';
  }

  const h1Elements = $('h1');
  const h1Count = h1Elements.length;
  const firstH1 = h1Elements.first().text().trim();
  let h1Status: 'OPTIMAL' | 'MULTIPLE' | 'MISSING' = 'MISSING';
  if (h1Count === 1) h1Status = 'OPTIMAL';
  else if (h1Count > 1) h1Status = 'MULTIPLE';

  const robotsMeta = ($('meta[name="robots"]').attr('content') || '').toLowerCase();
  const isIndexable = !robotsMeta.includes('noindex');

  const canonical = ($('link[rel="canonical"]').attr('href') || '').trim();
  const canonicalMatches = canonical.length > 0 && (canonical === finalUrl || canonical === siteUrl);

  const ogTitle = $('meta[property="og:title"]').attr('content') || undefined;
  const ogDescription = $('meta[property="og:description"]').attr('content') || undefined;
  const hasOpenGraph = Boolean(ogTitle || ogDescription || $('meta[property="og:image"]').attr('content'));

  // Check robots.txt
  const robotsTxtInfo = await checkRobotsTxt(parsedFinalUrl.origin);

  const seo: SEOAudit = {
    hasTitle: titleLength > 0,
    title: rawTitle,
    titleLength,
    titleStatus,
    hasDescription: descLength > 0,
    description: metaDesc,
    descriptionLength: descLength,
    descriptionStatus,
    hasH1: h1Count > 0,
    h1Count,
    h1Content: firstH1,
    h1Status,
    hasRobotsMeta: robotsMeta.length > 0,
    robotsMetaContent: robotsMeta,
    isIndexable,
    hasCanonical: canonical.length > 0,
    canonicalUrl: canonical,
    canonicalMatches,
    hasOpenGraph,
    ogTitle,
    ogDescription,
    hasRobotsTxt: robotsTxtInfo.hasRobotsTxt,
    robotsTxtHasSitemap: robotsTxtInfo.hasSitemap,
    robotsTxtUrl: robotsTxtInfo.robotsTxtUrl
  };

  // 2. TRACKING / ANALYTICS TAGS
  const fullPageText = html;
  
  // GA4: G-[A-Z0-9]{4,15}
  const ga4Matches = Array.from(new Set(fullPageText.match(/G-[A-Z0-9]{5,14}/gi) || []));
  // GTM: GTM-[A-Z0-9]{4,12}
  const gtmMatches = Array.from(new Set(fullPageText.match(/GTM-[A-Z0-9]{4,12}/gi) || []));
  const hasMetaPixel = fullPageText.includes('fbq(') || fullPageText.includes('connect.facebook.net');
  const hasHotjar = fullPageText.includes('hotjar.com') || fullPageText.includes('hjid:');
  const hasMatomo = fullPageText.includes('matomo.js') || fullPageText.includes('_paq');
  const hasPlausible = fullPageText.includes('plausible.io') || fullPageText.includes('data-domain=');

  let totalTrackers = (ga4Matches.length > 0 ? 1 : 0) +
    (gtmMatches.length > 0 ? 1 : 0) +
    (hasMetaPixel ? 1 : 0) +
    (hasHotjar ? 1 : 0) +
    (hasMatomo ? 1 : 0) +
    (hasPlausible ? 1 : 0);

  const tracking: TrackingAudit = {
    hasGA4: ga4Matches.length > 0,
    ga4Ids: ga4Matches.slice(0, 3),
    hasGTM: gtmMatches.length > 0,
    gtmIds: gtmMatches.slice(0, 3),
    hasMetaPixel,
    hasHotjar,
    hasMatomo,
    hasPlausible,
    totalTrackersFound: totalTrackers
  };

  // 3. SECURITY HEADERS AUDIT
  const hstsVal = headers['strict-transport-security'];
  const cspVal = headers['content-security-policy'];
  const xfoVal = headers['x-frame-options'];
  const xctoVal = headers['x-content-type-options'];
  const refVal = headers['referrer-policy'];
  const permVal = headers['permissions-policy'] || headers['feature-policy'];

  const hsts: HeaderCheckItem = {
    present: Boolean(hstsVal),
    value: hstsVal,
    score: hstsVal ? 25 : 0,
    recommendation: hstsVal ? 'HSTS actif' : 'Ajouter Strict-Transport-Security: max-age=31536000; includeSubDomains'
  };

  const csp: HeaderCheckItem = {
    present: Boolean(cspVal),
    value: cspVal,
    score: cspVal ? 25 : 0,
    recommendation: cspVal ? 'Content-Security-Policy actif' : 'Définir une politique CSP pour empêcher les injections XSS'
  };

  const xFrameOptions: HeaderCheckItem = {
    present: Boolean(xfoVal),
    value: xfoVal,
    score: xfoVal ? 15 : 0,
    recommendation: xfoVal ? 'Protection Clickjacking active' : 'Ajouter X-Frame-Options: SAMEORIGIN ou DENY'
  };

  const xContentTypeOptions: HeaderCheckItem = {
    present: Boolean(xctoVal),
    value: xctoVal,
    score: xctoVal ? 15 : 0,
    recommendation: xctoVal ? 'Sniffing MIME bloqué' : 'Ajouter X-Content-Type-Options: nosniff'
  };

  const referrerPolicy: HeaderCheckItem = {
    present: Boolean(refVal),
    value: refVal,
    score: refVal ? 10 : 0,
    recommendation: refVal ? 'Politique de Referrer définie' : 'Ajouter Referrer-Policy: strict-origin-when-cross-origin'
  };

  const permissionsPolicy: HeaderCheckItem = {
    present: Boolean(permVal),
    value: permVal,
    score: permVal ? 10 : 0,
    recommendation: permVal ? 'Permissions d\'APIs restreintes' : 'Ajouter Permissions-Policy (geolocation=(), camera=())'
  };

  const securityScore = hsts.score + csp.score + xFrameOptions.score + xContentTypeOptions.score + referrerPolicy.score + permissionsPolicy.score;
  let securityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (securityScore >= 90) securityGrade = 'A+';
  else if (securityScore >= 75) securityGrade = 'A';
  else if (securityScore >= 60) securityGrade = 'B';
  else if (securityScore >= 40) securityGrade = 'C';
  else if (securityScore >= 20) securityGrade = 'D';

  const security: SecurityHeadersAudit = {
    hsts,
    csp,
    xFrameOptions,
    xContentTypeOptions,
    referrerPolicy,
    permissionsPolicy,
    securityScore,
    securityGrade
  };

  // 4. BROKEN LINKS AUDIT (Sample 6-8 internal links)
  const linksFound: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return;
    }
    try {
      const resolved = new URL(href, finalUrl);
      // Only keep same origin links
      if (resolved.origin === parsedFinalUrl.origin && resolved.pathname !== parsedFinalUrl.pathname) {
        if (!linksFound.includes(resolved.toString())) {
          linksFound.push(resolved.toString());
        }
      }
    } catch {
      // Ignore invalid URLs
    }
  });

  const linksToTest = linksFound.slice(0, 6);
  const testedLinks = await Promise.all(linksToTest.map(checkLink));
  const brokenCount = testedLinks.filter(l => l.status === 'BROKEN').length;

  // 5. OVERALL HEALTH SCORE CALCULATION
  // Score out of 100
  let score = 0;

  // Title: 12 pts (optimal: 12, too short/long: 8, missing: 0)
  if (seo.titleStatus === 'OPTIMAL') score += 12;
  else if (seo.hasTitle) score += 7;

  // Description: 10 pts
  if (seo.descriptionStatus === 'OPTIMAL') score += 10;
  else if (seo.hasDescription) score += 6;

  // H1: 10 pts
  if (seo.h1Status === 'OPTIMAL') score += 10;
  else if (seo.hasH1) score += 6;

  // Robots txt: 6 pts
  if (seo.hasRobotsTxt) score += 6;

  // Canonical: 6 pts
  if (seo.hasCanonical) score += 6;

  // Security score scaled to 30 pts
  score += Math.round((security.securityScore / 100) * 30);

  // Link integrity: 16 pts (deduct 5 pts per broken link)
  const linksScore = Math.max(0, 16 - (brokenCount * 8));
  score += linksScore;

  // Tracking tag present: 10 pts bonus for professional setups
  if (tracking.totalTrackersFound > 0) score += 10;

  score = Math.min(100, Math.max(0, score));

  let healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (score < 50) healthStatus = 'CRITICAL';
  else if (score < 75) healthStatus = 'WARNING';

  return {
    timestamp,
    healthScore: score,
    healthStatus,
    seo,
    tracking,
    security,
    links: {
      totalChecked: testedLinks.length,
      brokenCount,
      testedLinks
    },
    durationMs: Math.round(performance.now() - startTime)
  };
}
