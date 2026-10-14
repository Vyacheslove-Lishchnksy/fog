"""Dev-сервер без кешування: python scripts/serve.py [port].

Той самий http.server, але з Cache-Control: no-store — браузер завжди
бере свіжі файли, ніякого «все таке саме» після правок.
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    srv = ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler)
    print(f"serving on http://localhost:{port} (no cache)")
    srv.serve_forever()
