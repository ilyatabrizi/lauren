#!/usr/bin/env python3
"""Local preview for the LAUREN storefront.  python3 serve.py  ->  :8071"""
import functools, http.server, os, pathlib, socketserver

PORT = int(os.environ.get("PORT", 8071))
ROOT = pathlib.Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.webmanifest': 'application/manifest+json',
        '.woff2': 'font/woff2',
        '.js': 'text/javascript',
    }

    def end_headers(self):
        # never cache while developing — the service worker is aggressive
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(
            ('', PORT), functools.partial(Handler, directory=str(ROOT))) as httpd:
        print(f'LAUREN  ->  http://localhost:{PORT}')
        httpd.serve_forever()
