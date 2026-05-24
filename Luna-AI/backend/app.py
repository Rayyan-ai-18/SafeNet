import os
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client

from detect.scanner import ScanEngine
from protect.checker import ProtectionChecker
from prevent.fixer import PreventionFixer

# Load environment variables from the backend directory explicitly.
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / ".env.local", override=True)

app = Flask(__name__)
CORS(app)

# Supabase Setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_WRITE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY
supabase: Client = None

if SUPABASE_URL and SUPABASE_WRITE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_WRITE_KEY)
        if SUPABASE_SERVICE_ROLE_KEY:
            print("[+] Supabase client initialized with service-role key.")
        else:
            print("[!] Supabase client initialized without service-role key; writes may fail due to RLS.")
    except Exception as e:
        print(f"[-] Supabase connection failed: {e}")
else:
    print("[!] Supabase credentials not found in backend/.env or backend/.env.local.")
    print("[!] Expected SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY.")

def save_scan_result(data):
    """Helper to save results to Supabase scans table."""
    if not supabase:
        print("[!] Skipping Supabase save (No credentials).")
        return
    try:
        response = supabase.table("scans").insert(data).execute()
        print("[+] Scan result saved to Supabase.")
    except Exception as e:
        print(f"[-] Error saving to Supabase: {e}")

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "Luna AI Backend is running", "endpoints": ["/scan (POST)"]})

@app.route('/scan', methods=['POST'])
def scan_url():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        url = data.get('url')
        
        if not url:
            return jsonify({"error": "URL is required"}), 400

        if not url.startswith("http"):
            return jsonify({"error": "Invalid URL format. Please include http:// or https://"}), 400

        print(f"[+] Starting deep scan for: {url}")
        results = {
            "url": url,
            "detect": {},
            "protect": {},
            "prevent": {}
        }

        # 1. Detect Phase
        print("[+] Phase 1: Detecting vulnerabilities...")
        scanner = ScanEngine(url)
        detect_results = scanner.run_all()
        results["detect"] = detect_results

        # 2. Protect Phase
        print("[+] Phase 2: Checking security headers...")
        checker = ProtectionChecker(url)
        protect_results = checker.check_headers()
        results["protect"] = protect_results

        # 3. Prevent Phase
        print("[+] Phase 3: Generating recommendations...")
        fixer = PreventionFixer(detect_results, protect_results)
        prevent_results = fixer.generate_recommendations()
        results["prevent"] = prevent_results

        print("[+] Scan complete. Sending results back to UI.")

        # Save only when we have a usable response payload.
        save_scan_result({
            "url": url,
            "detect": results["detect"],
            "protect": results["protect"]
        })

        return jsonify(results)
    except Exception as e:
        print(f"[-] FATAL API ERROR: {e}")
        return jsonify({"error": "Internal scan error. Please retry in a moment."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
