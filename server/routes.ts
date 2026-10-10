import { Router } from 'express';
import { fleetManager } from './services/fleetManager.ts';
import { authService } from './services/authService.ts';
import { requireAuth } from './middleware/authMiddleware.ts';

export const apiRouter = Router();

// ==================== AUTHENTICATION ROUTES ====================
// POST /api/auth/login
apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: 'Mot de passe requis' });
  }

  const token = authService.authenticate(password, username || 'admin');
  if (!token) {
    return res.status(401).json({ success: false, error: 'Identifiant ou mot de passe incorrect' });
  }

  res.json({
    success: true,
    token,
    user: {
      username: username || 'admin',
      role: 'Administrator'
    }
  });
});

// GET /api/auth/me
apiRouter.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  if (token && authService.validateToken(token)) {
    return res.json({
      success: true,
      authenticated: true,
      user: { username: 'admin', role: 'Administrator' }
    });
  }

  res.json({ success: true, authenticated: false });
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  if (token) {
    authService.revokeToken(token);
  }
  res.json({ success: true });
});

// POST /api/auth/change-password
apiRouter.post('/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Champs obligatoires manquants' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Le nouveau mot de passe doit comporter au moins 6 caractères' });
  }

  const success = authService.changePassword(currentPassword, newPassword);
  if (!success) {
    return res.status(400).json({ success: false, error: 'Mot de passe actuel incorrect' });
  }

  res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
});

// ==================== FLEET ROUTES ====================
// GET all sites with latest statuses
apiRouter.get('/sites', requireAuth, (req, res) => {
  const sites = fleetManager.getAll();
  res.json({
    success: true,
    data: sites
  });
});

// GET single site
apiRouter.get('/sites/:id', requireAuth, (req, res) => {
  const site = fleetManager.getById(req.params.id);
  if (!site) {
    return res.status(404).json({ success: false, error: 'Site non trouvé' });
  }
  res.json({ success: true, data: site });
});

// POST new site
apiRouter.post('/sites', requireAuth, async (req, res) => {
  const { name, url, category, checkIntervalSeconds, alertLatencyThresholdMs, expectedStatus } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'L\'URL du site est obligatoire' });
  }

  try {
    const record = await fleetManager.addSite({
      name,
      url,
      category,
      checkIntervalSeconds,
      alertLatencyThresholdMs,
      expectedStatus
    });
    res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update site
apiRouter.put('/sites/:id', requireAuth, (req, res) => {
  const updated = fleetManager.updateSite(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Site non trouvé' });
  }
  res.json({ success: true, data: updated });
});

// DELETE site
apiRouter.delete('/sites/:id', requireAuth, (req, res) => {
  const deleted = fleetManager.deleteSite(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Site non trouvé' });
  }
  res.json({ success: true });
});

// Quick probe single site (Uptime + SSL + DNS)
apiRouter.post('/sites/:id/check', requireAuth, async (req, res) => {
  const record = await fleetManager.checkSite(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Site non trouvé' });
  }
  res.json({ success: true, data: record });
});

// Deep health audit single site (SEO, Tracking, Security Headers, Links)
apiRouter.post('/sites/:id/audit', requireAuth, async (req, res) => {
  const record = await fleetManager.auditSite(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Site non trouvé' });
  }
  res.json({ success: true, data: record });
});

// Audit all sites
apiRouter.post('/sites/audit-all', requireAuth, async (req, res) => {
  // Fire audit in background and return immediate response
  fleetManager.auditAll().catch(err => console.error('Audit all error:', err));
  res.json({ success: true, message: 'Scan global initié en arrière-plan' });
});

// Reset to default sites
apiRouter.post('/sites/reset', requireAuth, (req, res) => {
  fleetManager.resetToDefaults();
  res.json({ success: true, message: 'Parc réinitialisé avec les sites de démonstration' });
});

// Global KPIs
apiRouter.get('/kpis', requireAuth, (req, res) => {
  const kpis = fleetManager.getGlobalKPIs();
  res.json({ success: true, data: kpis });
});

// Export JSON
apiRouter.get('/export/json', requireAuth, (req, res) => {
  const sites = fleetManager.getAll();
  const kpis = fleetManager.getGlobalKPIs();
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    generator: 'MK Monitor (Matt Konnect)',
    kpis,
    fleet: sites
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="mk_monitor_audit_${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify(exportPayload, null, 2));
});

// Export CSV
apiRouter.get('/export/csv', requireAuth, (req, res) => {
  const csvContent = fleetManager.exportCSV();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="mk_monitor_audit_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 support
});
