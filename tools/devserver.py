# Tiny THREADED static dev server that disables caching, so edited JS/CSS
# always reload (and parallel module requests don't deadlock).
import sys, functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5050
DIRECTORY = sys.argv[2] if len(sys.argv) > 2 else "."

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()
    def log_message(self, *a):
        pass

Handler = functools.partial(NoCacheHandler, directory=DIRECTORY)
httpd = ThreadingHTTPServer(("", PORT), Handler)
httpd.daemon_threads = True
print(f"dev server (no-cache, threaded) on :{PORT} serving {DIRECTORY}")
httpd.serve_forever()
