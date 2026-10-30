#!/usr/bin/env python3
"""
KrishiSense (AI4RISS) — Unified Project Launcher
Runs both the FastAPI Backend and the Web Frontend concurrently.
"""

import sys
import os
import time
import webbrowser
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

FRONTEND_PORT = 3000
BACKEND_PORT = 8000
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))

def run_frontend():
    os.chdir(WORKSPACE_DIR)
    class Handler(SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Suppress excessive HTTP access logs for clean CLI output

    server = HTTPServer(("0.0.0.0", FRONTEND_PORT), Handler)
    print(f"  🌾 [Frontend] Web App running at: http://localhost:{FRONTEND_PORT}")
    server.serve_forever()

def run_backend():
    try:
        import uvicorn
        print(f"  ⚡ [Backend]  FastAPI API running at: http://localhost:{BACKEND_PORT}")
        print(f"  📚 [Docs]     Swagger UI docs at: http://localhost:{BACKEND_PORT}/docs")
        uvicorn.run("backend.main:app", host="0.0.0.0", port=BACKEND_PORT, log_level="warning")
    except ImportError:
        print("\n  ⚠️  Notice: 'uvicorn' / 'fastapi' not found in current environment.")
        print("  👉 Run: pip install -r backend/requirements.txt to enable the ML API backend.")
        print(f"  👉 Web app is currently running at: http://localhost:{FRONTEND_PORT}")
        while True:
            time.sleep(1)

def main():
    print("=" * 65)
    print("  🌱 KrishiSense (AI4RISS) — Sustainable Farm Intelligence Platform")
    print("=" * 65)

    # Start frontend thread
    frontend_thread = threading.Thread(target=run_frontend, daemon=True)
    frontend_thread.start()

    # Open browser automatically
    def open_browser():
        time.sleep(1.0)
        webbrowser.open(f"http://localhost:{FRONTEND_PORT}")

    threading.Thread(target=open_browser, daemon=True).start()

    # Start backend
    try:
        run_backend()
    except KeyboardInterrupt:
        print("\n  👋 Shutting down KrishiSense services. Goodbye!")
        sys.exit(0)

if __name__ == "__main__":
    main()
