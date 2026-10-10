import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');

interface StoredAuth {
  username: string;
  passwordHash: string;
  salt: string;
  updatedAt: string;
}

interface ActiveSession {
  token: string;
  username: string;
  createdAt: number;
}

class AuthService {
  private authConfig: StoredAuth;
  private sessions: Map<string, ActiveSession> = new Map();

  constructor() {
    this.authConfig = this.loadAuthConfig();
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  private loadAuthConfig(): StoredAuth {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(AUTH_FILE)) {
      try {
        const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Erreur lecture auth.json:', err);
      }
    }

    // Default credentials: admin / mattkonnect2026 (or env variable)
    const defaultPassword = process.env.ADMIN_PASSWORD || 'mattkonnect2026';
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(defaultPassword, salt);

    const initialAuth: StoredAuth = {
      username: 'admin',
      passwordHash,
      salt,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(AUTH_FILE, JSON.stringify(initialAuth, null, 2), 'utf-8');
    return initialAuth;
  }

  public authenticate(password: string, username = 'admin'): string | null {
    if (username.toLowerCase() !== this.authConfig.username.toLowerCase()) {
      return null;
    }

    const testHash = this.hashPassword(password, this.authConfig.salt);
    if (crypto.timingSafeEqual(Buffer.from(testHash), Buffer.from(this.authConfig.passwordHash))) {
      // Create session token
      const token = 'mks_' + crypto.randomBytes(32).toString('hex');
      this.sessions.set(token, {
        token,
        username: this.authConfig.username,
        createdAt: Date.now()
      });
      return token;
    }

    return null;
  }

  public validateToken(token?: string): boolean {
    if (!token) return false;
    const session = this.sessions.get(token);
    if (!session) return false;

    // Sessions valid for 7 days
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.createdAt > maxAge) {
      this.sessions.delete(token);
      return false;
    }

    return true;
  }

  public revokeToken(token: string): void {
    this.sessions.delete(token);
  }

  public changePassword(currentPass: string, newPass: string): boolean {
    const currentHash = this.hashPassword(currentPass, this.authConfig.salt);
    if (!crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(this.authConfig.passwordHash))) {
      return false;
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = this.hashPassword(newPass, newSalt);

    this.authConfig = {
      username: 'admin',
      passwordHash: newHash,
      salt: newSalt,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(AUTH_FILE, JSON.stringify(this.authConfig, null, 2), 'utf-8');
    this.sessions.clear(); // Revoke existing sessions
    return true;
  }
}

export const authService = new AuthService();
