#!/usr/bin/env python3
"""Feedback server for Radiant Play annotation layer. Port 3737, stdlib only."""

import json
import os
import errno
import time
import random
import string
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

INBOX = os.path.join(os.path.dirname(__file__), 'inbox.jsonl')
CORS_ORIGIN = '*'  # any localhost port (Vite picks dynamically)


def read_entries():
    if not os.path.exists(INBOX):
        return []
    entries = []
    with open(INBOX, 'r') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return entries


def write_entries(entries):
    with open(INBOX, 'w') as f:
        for entry in entries:
            f.write(json.dumps(entry) + '\n')


def append_entry(entry):
    with open(INBOX, 'a') as f:
        f.write(json.dumps(entry) + '\n')


def make_id():
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"fbk_{int(time.time())}_{suffix}"


class FeedbackHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # suppress default request logging

    def send_cors(self):
        self.send_header('Access-Control-Allow-Origin', CORS_ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/feedback':
            entries = read_entries()
            pending = [e for e in entries if e.get('status') == 'pending']
            body = json.dumps(pending).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_cors()
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else b'{}'

        if parsed.path == '/feedback':
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_cors()
                self.end_headers()
                return

            entry = {
                'id': make_id(),
                'ts': data.get('ts', ''),
                'url': data.get('url', ''),
                'prototypeName': data.get('prototypeName', ''),
                'selector': data.get('selector', ''),
                'componentChain': data.get('componentChain', []),
                'tagName': data.get('tagName', ''),
                'textContent': data.get('textContent', ''),
                'outerHTMLSnippet': data.get('outerHTMLSnippet', ''),
                'boundingBox': data.get('boundingBox', {}),
                'comment': data.get('comment', ''),
                'status': 'pending',
                'processedAt': None,
            }
            append_entry(entry)
            resp = json.dumps({'ok': True, 'id': entry['id']}).encode()
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.send_cors()
            self.end_headers()
            self.wfile.write(resp)
            print(f"[feedback] #{entry['id']} — {entry['prototypeName']} — {entry['comment'][:60]}")

        elif parsed.path.startswith('/feedback/') and parsed.path.endswith('/done'):
            entry_id = parsed.path.split('/')[2]
            entries = read_entries()
            found = False
            for e in entries:
                if e['id'] == entry_id:
                    e['status'] = 'done'
                    e['processedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                    found = True
                    break
            if found:
                write_entries(entries)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_cors()
                self.end_headers()
                self.wfile.write(b'{"ok": true}')
            else:
                self.send_response(404)
                self.send_cors()
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == '__main__':
    try:
        server = HTTPServer(('localhost', 3737), FeedbackHandler)
    except OSError as e:
        if e.errno == errno.EADDRINUSE:
            print('[feedback] Port 3737 is already in use — is the server already running?')
        else:
            print(f'[feedback] Could not start server: {e}')
        raise SystemExit(1)
    print('[feedback] Server running at http://localhost:3737')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
