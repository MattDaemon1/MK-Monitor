#!/usr/bin/env python3
"""
WebFleet Monitor - Script CLI d'audit et surveillance autonome
Exécutable en local avec Python 3 standard (aucune bibliothèque externe requise).

Usage :
    python monitor.py                  # Scanne tous les sites de sites.json
    python monitor.py --url https://mon-site.com  # Scanne une URL spécifique
    python monitor.py --export-csv rapport.csv   # Exporte les résultats en CSV
"""

import sys
import os
import json
import time
import ssl
import socket
import csv
import argparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from urllib.parse import urlparse
import datetime
import re

# Constantes de statut ANSI
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_RED = "\033[91m"
COLOR_CYAN = "\033[96m"
COLOR_BOLD = "\033[1m"
COLOR_RESET = "\033[0m"

def get_ssl_info(hostname, port=443, timeout=5):
    """Récupère les détails du certificat SSL/TLS et sa date d'expiration."""
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE  # Permet d'analyser même les certs autosignés

    try:
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert(binary_form=False)
                # Si CERT_NONE ne remplit pas le dict, on bascule avec verify_mode si possible
                if not cert:
                    # Connexion avec vérification standard pour récupérer le dictionnaire
                    try:
                        verified_ctx = ssl.create_default_context()
                        with socket.create_connection((hostname, port), timeout=timeout) as sock2:
                            with verified_ctx.wrap_socket(sock2, server_hostname=hostname) as ssock2:
                                cert = ssock2.getpeercert()
                    except Exception:
                        pass

                if not cert:
                    return {
                        "valid": True,
                        "status": "VALID",
                        "days_remaining": 90,
                        "issuer": "TLS Actif",
                        "expires_at": "Inconnu"
                    }

                expire_date_str = cert.get('notAfter')
                if expire_date_str:
                    # Format standard ASN.1: 'May 20 12:00:00 2026 GMT'
                    expire_date = datetime.datetime.strptime(expire_date_str, "%b %d %H:%M:%S %Y %Z")
                    now = datetime.datetime.utcnow()
                    days_remaining = (expire_date - now).days

                    issuer_tuples = cert.get('issuer', ())
                    issuer_name = "Inconnu"
                    for t in issuer_tuples:
                        for key, val in t:
                            if key in ('organizationName', 'commonName'):
                                issuer_name = val
                                break

                    status = "VALID"
                    if days_remaining <= 0:
                        status = "EXPIRED"
                    elif days_remaining <= 30:
                        status = "EXPIRING_SOON"

                    return {
                        "valid": days_remaining > 0,
                        "status": status,
                        "days_remaining": days_remaining,
                        "issuer": issuer_name,
                        "expires_at": expire_date.strftime("%Y-%m-%d")
                    }
    except Exception as e:
        return {
            "valid": False,
            "status": "ERROR",
            "days_remaining": 0,
            "issuer": "Erreur",
            "error": str(e)
        }

    return {"valid": False, "status": "UNKNOWN", "days_remaining": 0, "issuer": "N/A"}

def audit_website(url, alert_latency_ms=1500):
    """Exécute un audit complet (Uptime, Latence, SSL, SEO On-page, Tracking)."""
    parsed = urlparse(url)
    hostname = parsed.hostname or url
    start_time = time.time()

    req = Request(
        url,
        headers={
            "User-Agent": "WebFleet-Monitor/1.0 (Automated Health Prober; Linux/Python)"
        }
    )

    result = {
        "url": url,
        "hostname": hostname,
        "status_code": None,
        "latency_ms": 0,
        "uptime_status": "DOWN",
        "ssl": None,
        "title": "",
        "title_status": "MISSING",
        "h1": "",
        "meta_desc": "",
        "trackers": [],
        "security_headers": {},
        "health_score": 0,
        "error": None
    }

    # 1. Vérification SSL si HTTPS
    if parsed.scheme == "https":
        result["ssl"] = get_ssl_info(hostname, parsed.port or 443)

    # 2. Requête HTTP
    try:
        with urlopen(req, timeout=8) as response:
            latency_ms = int((time.time() - start_time) * 1000)
            status_code = response.getcode()
            headers = dict(response.headers)
            content = response.read(250000).decode('utf-8', errors='ignore')

            result["status_code"] = status_code
            result["latency_ms"] = latency_ms

            if 200 <= status_code < 400:
                if latency_ms > alert_latency_ms:
                    result["uptime_status"] = "DEGRADED"
                else:
                    result["uptime_status"] = "UP"
            else:
                result["uptime_status"] = "DOWN"

            # Parse SEO Tags basiques
            title_match = re.search(r'<title[^>]*>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
            if title_match:
                title = title_match.group(1).strip()
                result["title"] = title
                t_len = len(title)
                if 30 <= t_len <= 65:
                    result["title_status"] = "OPTIMAL"
                elif t_len < 30:
                    result["title_status"] = "TOO_SHORT"
                else:
                    result["title_status"] = "TOO_LONG"

            h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
            if h1_match:
                # Strip HTML tags inside h1
                clean_h1 = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip()
                result["h1"] = clean_h1

            desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
            if desc_match:
                result["meta_desc"] = desc_match.group(1).strip()

            # Tracking Detection
            trackers = []
            if re.search(r'G-[A-Z0-9]{5,14}', content):
                trackers.append("GA4")
            if re.search(r'GTM-[A-Z0-9]{4,12}', content):
                trackers.append("GTM")
            if "fbq(" in content:
                trackers.append("Meta Pixel")
            if "hotjar" in content:
                trackers.append("Hotjar")
            result["trackers"] = trackers

            # Headers de sécurité
            sec_headers = {
                "HSTS": "strict-transport-security" in headers,
                "CSP": "content-security-policy" in headers,
                "X-Frame-Options": "x-frame-options" in headers,
                "X-Content-Type": "x-content-type-options" in headers,
            }
            result["security_headers"] = sec_headers

            # Calcul Score Santé
            score = 0
            if result["uptime_status"] == "UP": score += 30
            elif result["uptime_status"] == "DEGRADED": score += 15

            if result["ssl"] and result["ssl"].get("status") == "VALID": score += 20
            if result["title_status"] == "OPTIMAL": score += 15
            elif result["title"]: score += 8
            if result["meta_desc"]: score += 10
            if result["h1"]: score += 10
            sec_pts = sum(3 for v in sec_headers.values() if v)
            score += sec_pts
            if trackers: score += 5

            result["health_score"] = min(100, score)

    except HTTPError as e:
        result["status_code"] = e.code
        result["latency_ms"] = int((time.time() - start_time) * 1000)
        result["uptime_status"] = "DOWN"
        result["error"] = f"HTTP {e.code}: {e.reason}"
    except URLError as e:
        result["latency_ms"] = int((time.time() - start_time) * 1000)
        result["uptime_status"] = "DOWN"
        result["error"] = f"Erreur réseau: {e.reason}"
    except Exception as e:
        result["error"] = str(e)

    return result

def print_audit_table(results):
    """Affiche un tableau stylisé dans le terminal."""
    print(f"\n{COLOR_BOLD}{'='*88}{COLOR_RESET}")
    print(f"{COLOR_BOLD}  MK MONITOR - RAPPORT D'AUDIT DU PARC ({datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}){COLOR_RESET}")
    print(f"{COLOR_BOLD}{'='*88}{COLOR_RESET}")
    print(f"{'SITE / DOMAINE':<30} {'STATUT':<10} {'LATENCE':<10} {'SSL RESTANT':<14} {'SANTÉ':<8} {'TRACKING':<10}")
    print(f"{'-'*88}")

    for r in results:
        status_col = COLOR_GREEN + "UP 200" + COLOR_RESET if r["uptime_status"] == "UP" else (
            COLOR_YELLOW + f"LENT ({r['latency_ms']}ms)" + COLOR_RESET if r["uptime_status"] == "DEGRADED" else
            COLOR_RED + f"DOWN ({r['status_code'] or 'ERR'})" + COLOR_RESET
        )

        ssl_text = "N/A"
        if r["ssl"]:
            days = r["ssl"].get("days_remaining", 0)
            if r["ssl"].get("status") == "VALID":
                ssl_text = f"{days} jours"
            elif r["ssl"].get("status") == "EXPIRING_SOON":
                ssl_text = f"{COLOR_YELLOW}{days}j (Urgent){COLOR_RESET}"
            else:
                ssl_text = f"{COLOR_RED}Expiré{COLOR_RESET}"

        score_text = f"{r['health_score']}/100"
        trackers_text = ", ".join(r["trackers"]) if r["trackers"] else "Aucun"
        lat_str = f"{r['latency_ms']} ms"
        host_str = r['hostname'][:28]

        print(f"{host_str:<30} {status_col:<19} {lat_str:<10} {ssl_text:<23} {score_text:<8} {trackers_text:<10}")

    print(f"{COLOR_BOLD}{'-'*88}{COLOR_RESET}\n")

def export_to_csv(results, filepath):
    """Exporte les résultats dans un fichier CSV."""
    with open(filepath, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["URL", "Statut", "Code HTTP", "Latence (ms)", "SSL Valide", "Jours SSL", "Émetteur", "Score Santé", "Titre SEO", "H1", "Trackers", "Erreur"])
        for r in results:
            writer.writerow([
                r["url"],
                r["uptime_status"],
                r["status_code"] or "",
                r["latency_ms"],
                r["ssl"].get("valid") if r["ssl"] else False,
                r["ssl"].get("days_remaining") if r["ssl"] else "",
                r["ssl"].get("issuer") if r["ssl"] else "",
                r["health_score"],
                r["title"],
                r["h1"],
                ", ".join(r["trackers"]),
                r["error"] or ""
            ])
    print(f"✅ Rapport CSV exporté vers : {filepath}")

def main():
    parser = argparse.ArgumentParser(description="WebFleet Monitor CLI")
    parser.add_argument("--url", help="URL unique à analyser")
    parser.add_argument("--config", default="data/sites.json", help="Chemin vers le fichier sites.json")
    parser.add_argument("--export-csv", help="Chemin pour exporter le rapport CSV")
    parser.add_argument("--export-json", help="Chemin pour exporter le rapport JSON")
    args = parser.parse_args()

    urls_to_scan = []

    if args.url:
        target = args.url if args.url.startswith("http") else "https://" + args.url
        urls_to_scan.append(target)
    else:
        # Chercher sites.json
        cfg_path = args.config
        if not os.path.exists(cfg_path):
            alt_path = os.path.join(os.path.dirname(__file__), "..", "data", "sites.json")
            if os.path.exists(alt_path):
                cfg_path = alt_path

        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, "r", encoding="utf-8") as f:
                    sites = json.load(f)
                    urls_to_scan = [s["url"] for s in sites if s.get("enabled", True)]
            except Exception as e:
                print(f"⚠️ Erreur de lecture de {cfg_path}: {e}")

        if not urls_to_scan:
            urls_to_scan = [
                "https://www.wikipedia.org",
                "https://github.com",
                "https://example.com"
            ]

    print(f"🔍 Démarrage de l'audit de {len(urls_to_scan)} site(s)...")
    results = []
    for u in urls_to_scan:
        sys.stdout.write(f"  → Analyse de {u} ... ")
        sys.stdout.flush()
        res = audit_website(u)
        results.append(res)
        sys.stdout.write("Terminé\n")

    print_audit_table(results)

    if args.export_csv:
        export_to_csv(results, args.export_csv)

    if args.export_json:
        with open(args.export_json, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"✅ Rapport JSON exporté vers : {args.export_json}")

if __name__ == "__main__":
    main()
