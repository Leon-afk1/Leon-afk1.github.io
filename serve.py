"""
Simple HTTP server for testing the portfolio locally
Run: python serve.py
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 3000
DIRECTORY = "."

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print(f"🌐 Portfolio server running at: {url}")
        print("=" * 60)
        print(f"📂 Serving files from: {os.getcwd()}")
        print(f"🔗 Opening browser...")
        print("\n Press CTRL+C to stop the server")
        print("=" * 60)
        
        # Open browser automatically
        webbrowser.open(url)
        
        # Serve forever
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped")

if __name__ == "__main__":
    main()
