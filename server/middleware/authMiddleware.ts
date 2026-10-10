import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.ts';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token && typeof req.query.token === 'string') {
    // Also accept token in query parameter for direct CSV/JSON download links in browser
    token = req.query.token;
  }

  if (!token || !authService.validateToken(token)) {
    res.status(401).json({
      success: false,
      error: 'Accès non autorisé : session expirée ou identifiant invalide'
    });
    return;
  }

  next();
}
