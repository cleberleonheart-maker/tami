/*
 * TAMI Companion Server
 * Roda num PC com a sua biblioteca de música e se conecta à aba "Celular"
 * do app TAMI (controle remoto da PC via /remote e /cmd).
 *
 * Uso:
 *   node companion/server.js
 *   TAMI_PORT=8081 TAMI_MUSIC=/caminho/musicas node companion/server.js
 *
 * Requisitos: Node.js instalado. Nenhuma dependência externa.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = Number(process.env.TAMI_PORT || 8081);
const ROOT = path.resolve(__dirname, '..');
const MUSIC = path.resolve(process.env.TAMI_MUSIC || path.join(__dirname, 'music'));
const MAX_SONGS = 500;

const AUDIO_EXT = new Set(['.mp3', '.m4a', '.aac', '.ogg', '.opus', '.wav', '.flac', '.wma']);
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.apk': 'application/vnd.android.package-archive'
};

let lastState = null;
const subs = new Set();
let musicCache = { at: 0, songs: [] };

function scanMusic() {
  const now = Date.now();
  if (now - musicCache.at < 15000) return musicCache.songs;
  const out = [];
  if (fs.existsSync(MUSIC)) {
    const walk = (dir) => {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
      for (const e of entries) {
        if (out.length >= MAX_SONGS) return;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full); continue; }
        const ext = path.extname(e.name).toLowerCase();
        if (!AUDIO_EXT.has(ext)) continue;
        let size = 0;
        try { size = fs.statSync(full).size; } catch (e) {}
        const base = e.name.slice(0, -ext.length).trim();
        const parts = base.split(/\s*-\s*/);
        const title = parts.length > 1 ? parts.slice(1).join(' -').trim() : base;
        const artist = parts.length > 1 ? parts[0].trim() : '';
        out.push({
          id: String(out.length),
          title, artist, album: '', durationMs: 0, type: 'song',
          name: e.name, size, path: full
        });
      }
    };
    walk(MUSIC);
  }
  musicCache = { at: now, songs: out };
  return out;
}

function sendCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}
function sendJSON(res, code, obj) {
  sendCORS(res);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function serveStatic(req, res, p) {
  let rel = decodeURIComponent(p);
  if (rel === '/') rel = '/index.html';
  const file = path.join(ROOT, path.normalize(rel));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    sendCORS(res);
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('404');
    return;
  }
  sendCORS(res);
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

function serveAudio(req, res, p) {
  const m = p.match(/^\/api\/audio\/(\d+)$/);
  if (!m) { sendJSON(res, 404, { error: 'not found' }); return; }
  const songs = scanMusic();
  const song = songs.find((s) => s.id === m[1]);
  if (!song) { sendJSON(res, 404, { error: 'not found' }); return; }
  let st;
  try { st = fs.statSync(song.path); } catch (e) { sendJSON(res, 404, { error: 'not found' }); return; }
  const range = req.headers.range;
  sendCORS(res);
  if (range) {
    const mm = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (mm) {
      let start = Number(mm[1]);
      let end = mm[2] ? Number(mm[2]) : st.size - 1;
      if (end >= st.size) end = st.size - 1;
      if (start < st.size && start <= end) {
        const len = end - start + 1;
        res.writeHead(206, {
          'content-type': 'application/octet-stream',
          'accept-ranges': 'bytes',
          'content-range': `bytes ${start}-${end}/${st.size}`,
          'content-length': len
        });
        fs.createReadStream(song.path, { start, end }).pipe(res);
        return;
      }
    }
  }
  res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': st.size, 'accept-ranges': 'bytes' });
  fs.createReadStream(song.path).pipe(res);
}

function stateJSON() {
  const songs = scanMusic().map((s) => ({
    id: s.id, title: s.title, artist: s.artist, album: s.album,
    durationMs: s.durationMs, type: 'song',
    url: `http://${LAN_IP()}:${PORT}/api/audio/${s.id}`
  }));
  const inst = lastState;
  return {
    dev: inst && inst.dev ? inst.dev : os.hostname(),
    state: inst ? { ...(inst.state || {}), ts: inst.ts } : null,
    songs: { songs }
  };
}

let cachedIP = null;
function LAN_IP() {
  if (cachedIP) return cachedIP;
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const n of nets[name] || []) {
      if (n.family === 'IPv4' && !n.internal) { cachedIP = n.address; return cachedIP; }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;

  if (req.method === 'OPTIONS') { sendCORS(res); res.writeHead(204); res.end(); return; }

  if (p === '/__companion__') {
    sendJSON(res, 200, { name: 'tami-companion', port: PORT });
    return;
  }

  if (p === '/api/state' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 512000) req.destroy(); });
    req.on('end', () => {
      try {
        const d = JSON.parse(body || '{}');
        d.ts = Date.now() / 1000;
        lastState = d;
      } catch (e) {}
      sendJSON(res, 200, { ok: true });
    });
    return;
  }

  if (p === '/api/events') {
    sendCORS(res);
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive'
    });
    res.write(': connected\n\n');
    subs.add(res);
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 15000);
    req.on('close', () => { clearInterval(ping); subs.delete(res); });
    return;
  }

  if (p === '/cmd' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 10000) req.destroy(); });
    req.on('end', () => {
      let msg = null;
      try { msg = JSON.parse(body || '{}'); } catch (e) {}
      if (msg && (msg.cmd || msg.cmd === '')) {
        const data = `data: ${JSON.stringify({ cmd: msg.cmd, value: msg.value })}\n\n`;
        for (const s of subs) { try { s.write(data); } catch (e) { subs.delete(s); } }
      }
      sendJSON(res, 200, { ok: true });
    });
    return;
  }

  if (p === '/remote') {
    sendJSON(res, 200, stateJSON());
    return;
  }

  if (p.startsWith('/api/audio/')) { serveAudio(req, res, p); return; }

  serveStatic(req, res, p);
});

server.listen(PORT, () => {
  console.log('TAMI Companion no ar!');
  console.log(`  Abra no PC  : http://localhost:${PORT}/`);
  console.log(`  No celular  : aba "Celular" do app => http://${LAN_IP()}:${PORT}`);
  console.log(`  Músicas     : ${MUSIC}${fs.existsSync(MUSIC) ? '' : '  (pasta vazia. Use TAMI_MUSIC=/caminho)'}`);
});