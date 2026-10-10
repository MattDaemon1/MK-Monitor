# MK Monitor - Audit & Surveillance Web (Matt Konnect)

Application conçue pour auditer, surveiller et faciliter la maintenance proactive de votre parc de sites web (Uptime, Certificats SSL/TLS, DNS, Health Check SEO, Balises de Tracking et En-têtes de Sécurité).

Déployable en 1 clic sur **AI Studio** ou exécutable en local sur votre machine.

---

## 1. Architecture Technique

- **Backend / Moteur de scan** : Node.js + Express (TypeScript), sondes sockets TLS natives (`tls.connect`) pour l'inspection des certificats X.509, résolveur DNS asynchrone, et Cheerio pour le parsing DOM.
- **Frontend / Dashboard** : React 19 SPA, Tailwind CSS v4, Lucide Icons, support Dark Mode épuré sans distractions.
- **Stockage local** : Fichiers JSON légers (`data/sites.json` et `data/history.json`), aucun serveur de base de données complexe requis.
- **Scripts CLI autonomes** :
  - `cli/monitor.py` : Script Python 3 autonome (sans dépendances tierces obligatoires).
  - `cli/monitor.mjs` : Script Node.js autonome.

### Structure des Dossiers

```text
mk-monitor/
├── data/
│   ├── sites.json            # Configuration du parc (Matt Konnect par défaut)
│   └── history.json          # Historique local des pings et latences
├── cli/
│   ├── monitor.py            # Script Python autonome de scan CLI
│   └── monitor.mjs           # Script Node.js autonome de scan CLI
├── server/
│   ├── services/
│   │   ├── uptimeChecker.ts  # Mesure latence, statut HTTP & redirections
│   │   ├── sslChecker.ts     # Inspection X.509, issuer, expiration
│   │   ├── dnsChecker.ts     # Résolution IPv4, IPv6, MX, NS
│   │   ├── healthAuditor.ts  # SEO On-page, tracking GA4/GTM, headers sécurité
│   │   └── fleetManager.ts   # Planificateur automatique & exports
│   ├── routes.ts             # API REST locale
│   └── types.ts              # Schémas TypeScript
├── src/                      # Interface Web React (Dashboard)
├── requirements.txt          # Dépendances Python
├── requirements.json         # Dépendances système & Node
├── server.ts                 # Serveur Express & Vite middleware
└── package.json
```

---

## 2. Déploiement sur AI Studio & Lancement Local

### Déploiement sur AI Studio
L'application est prête pour la production et s'exécute directement sur l'environnement Cloud Run d'AI Studio via le script `npm run build` et `server.ts`.

### Lancement Local (3 Étapes)
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'application
npm run dev
```
Ouvrez votre navigateur sur : **`http://localhost:3000`**

### Configuration des sites (`data/sites.json`)
Par défaut, le site de Matt Konnect est configuré :
```json
[
  {
    "id": "site-mattkonnect",
    "name": "Matt Konnect",
    "url": "https://mattkonnect.com",
    "category": "Agence & Production",
    "expectedStatus": 200,
    "checkIntervalSeconds": 60,
    "alertLatencyThresholdMs": 1500,
    "enabled": true
  }
]
```

### Étape 3 : Démarrer l'application locale
```bash
npm run dev
```
Ouvrez votre navigateur sur : **`http://localhost:3000`**

### Authentification & Sécurité d'accès
Un écran de connexion protège le tableau de bord et les routes d'API :
- **Identifiant par défaut** : `admin`
- **Mot de passe par défaut** : `mattkonnect2026`
- **Sécurité** : Chiffrement Scrypt avec salt aléatoire (stocké localement dans `data/auth.json`), jetons de session sécurisés avec Bearer auth, et possibilité de modifier le mot de passe à tout moment depuis l'interface ou via la variable d'environnement `ADMIN_PASSWORD`.

---

## 3. Utilisation en Ligne de Commande (CLI)

Si vous préférez exécuter un scan ponctuel dans un terminal, une tâche cron ou un serveur sans lancer l'interface web :

### Avec Python :
```bash
# Scanner tous les sites configurés dans data/sites.json
python3 cli/monitor.py

# Scanner une URL spécifique
python3 cli/monitor.py --url https://mon-site.com

# Exporter un rapport d'audit au format CSV
python3 cli/monitor.py --export-csv rapport.csv
```

### Avec Node.js :
```bash
node cli/monitor.mjs
```

---

## 4. Fonctionnalités Clés Incluses

1. **Monitoring Uptime & Latence** : Vérification des statuts HTTP (200, 404, 500), temps de réponse au milliseconde près (TTFB), suivi des redirections.
2. **Suivi SSL/TLS & Alertes d'Expiration** : Détection du nombre de jours restants avant expiration du certificat SSL, avertissement visuel si < 30 jours, autorité de certification (Let's Encrypt, DigiCert, Cloudflare, etc.).
3. **Audit de Santé Technique (Health Check)** :
   - **SEO On-Page** : Présence et longueur des balises `<title>`, `<meta description>`, titre `<h1>`, indexabilité (`meta robots`), fichier `robots.txt` et déclaration `sitemap`.
   - **Balises Analytics & Tracking** : Détection automatique des identifiants Google Analytics 4 (`G-XXXX`), Google Tag Manager (`GTM-XXXX`), Meta Pixel, Hotjar, Matomo.
   - **Sécurité HTTP OWASP** : Analyse de 6 en-têtes défensifs (HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) et attribution d'un grade de sécurité (A+ à F).
   - **Liens Internes Cassés** : Échantillonnage de liens internes avec détection des erreurs 404.
4. **Tableau de Bord Centralisé** : Vue d'ensemble avec KPIs globaux, recherche instantanée, filtres dynamiques (Sites en alerte, SSL expirant, Dégradés), et fiches d'inspection détaillée.
5. **Exports & Reporting Client** :
   - Téléchargement au format **JSON** pour intégration dans vos outils.
   - Téléchargement au format **CSV** compatible Excel / Google Sheets.
   - **Synthèse Exécutive** prête à copier en Markdown ou à imprimer pour présenter l'état des lieux aux clients.
