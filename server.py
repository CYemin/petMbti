from __future__ import annotations

import argparse
import contextlib
import socket
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent


class StaticHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def find_available_port(host: str, start_port: int) -> int:
    port = start_port
    while port < start_port + 100:
        with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            if sock.connect_ex((host, port)) != 0:
                return port
        port += 1
    raise RuntimeError("No available port was found. Please try again later.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Pet MBTI local website.")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind. Default: 127.0.0.1")
    parser.add_argument("--port", type=int, default=8080, help="Preferred port. Default: 8080")
    parser.add_argument(
        "--open",
        action="store_true",
        help="Open the site in your default browser after the server starts.",
    )
    args = parser.parse_args()

    port = find_available_port(args.host, args.port)
    url = f"http://{args.host}:{port}/index.html"

    server = ThreadingHTTPServer((args.host, port), StaticHandler)

    print("=" * 68)
    print("Pet MBTI site is running.")
    print(f"Project root: {ROOT}")
    print(f"Open this URL in your browser: {url}")
    print("Press Ctrl + C to stop the server.")
    print("=" * 68)

    if args.open:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
