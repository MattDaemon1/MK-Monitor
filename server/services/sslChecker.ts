import tls from 'tls';
import { URL } from 'url';
import { SSLResult } from '../types.js';

export async function checkSSL(targetUrl: string): Promise<SSLResult> {
  const timestamp = new Date().toISOString();

  let hostname: string;
  let port = 443;

  try {
    const parsed = new URL(targetUrl);
    hostname = parsed.hostname;
    if (parsed.port) {
      port = parseInt(parsed.port, 10);
    }
  } catch {
    return {
      timestamp,
      valid: false,
      issuer: 'Inconnu',
      subject: 'Inconnu',
      validFrom: '',
      validTo: '',
      daysRemaining: 0,
      status: 'ERROR',
      errorMessage: 'URL invalide pour la vérification SSL'
    };
  }

  return new Promise<SSLResult>((resolve) => {
    let resolved = false;

    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: false, // On inspecte le certificat même si expiré ou auto-signé
        timeout: 8000
      },
      () => {
        if (resolved) return;
        resolved = true;

        try {
          const cert = socket.getPeerCertificate(true);
          const protocol = socket.getProtocol() || undefined;
          const cipherInfo = socket.getCipher();
          const cipher = cipherInfo ? cipherInfo.name : undefined;

          socket.end();

          if (!cert || Object.keys(cert).length === 0) {
            resolve({
              timestamp,
              valid: false,
              issuer: 'Non détecté',
              subject: hostname,
              validFrom: '',
              validTo: '',
              daysRemaining: 0,
              status: 'ERROR',
              errorMessage: 'Aucun certificat TLS renvoyé par le serveur'
            });
            return;
          }

          const validFrom = cert.valid_from ? new Date(cert.valid_from).toISOString() : '';
          const validTo = cert.valid_to ? new Date(cert.valid_to).toISOString() : '';
          const now = Date.now();
          const expireTime = cert.valid_to ? new Date(cert.valid_to).getTime() : 0;
          const daysRemaining = Math.floor((expireTime - now) / (1000 * 60 * 60 * 24));

          let status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'ERROR' = 'VALID';
          if (daysRemaining <= 0) {
            status = 'EXPIRED';
          } else if (daysRemaining <= 30) {
            status = 'EXPIRING_SOON';
          }

          // Format issuer nicely
          let issuerStr = 'Inconnu';
          if (cert.issuer) {
            const rawIssuer = cert.issuer.O || cert.issuer.CN || cert.issuer.OU;
            if (Array.isArray(rawIssuer)) {
              issuerStr = rawIssuer.join(', ');
            } else if (typeof rawIssuer === 'string') {
              issuerStr = rawIssuer;
            } else {
              issuerStr = 'Autorité de certification';
            }
          }

          let subjectStr = hostname;
          if (cert.subject && cert.subject.CN) {
            const rawSubject = cert.subject.CN;
            subjectStr = Array.isArray(rawSubject) ? rawSubject.join(', ') : rawSubject;
          }

          resolve({
            timestamp,
            valid: daysRemaining > 0,
            issuer: issuerStr,
            subject: subjectStr,
            validFrom,
            validTo,
            daysRemaining,
            protocol,
            cipher,
            status
          });
        } catch (err: any) {
          resolve({
            timestamp,
            valid: false,
            issuer: 'Erreur',
            subject: hostname,
            validFrom: '',
            validTo: '',
            daysRemaining: 0,
            status: 'ERROR',
            errorMessage: err.message || 'Impossible d\'analyser le certificat'
          });
        }
      }
    );

    socket.on('timeout', () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({
        timestamp,
        valid: false,
        issuer: 'Timeout',
        subject: hostname,
        validFrom: '',
        validTo: '',
        daysRemaining: 0,
        status: 'ERROR',
        errorMessage: 'Délai dépassé lors de la négociation TLS (timeout 8s)'
      });
    });

    socket.on('error', (err: any) => {
      if (resolved) return;
      resolved = true;
      resolve({
        timestamp,
        valid: false,
        issuer: 'Erreur TLS',
        subject: hostname,
        validFrom: '',
        validTo: '',
        daysRemaining: 0,
        status: 'ERROR',
        errorMessage: err.message || 'Échec de connexion TLS'
      });
    });
  });
}
