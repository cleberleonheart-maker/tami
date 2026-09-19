/*
 * TAMI Companion Server
 * Roda num PC com a sua biblioteca de música e se conecta à aba "Celular"
 * do app TAMI (controle remoto da PC via /remote e /cmd).
 *
 * Uso:
 *   node companion/server.js
 *   TAMI_PORT=8081 TAMI_MUSIC=/caminho/musicas node companion/server.js
 *
 * Recursos:
 *   - Lê ID3v2/ID3v1, FLAC e WAV para título/artista/álbum/duração reais
 *   - Persiste o estado do player em ~/.tami-companion-state.json
 *   - Empacotável em binário único (companion/build.sh)
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
const DEV_MUSIC = path.join(__dirname, 'music');
const MUSIC = path.resolve(
  process.env.TAMI_MUSIC ||
  (fs.existsSync(DEV_MUSIC) ? DEV_MUSIC : path.join(os.homedir(), 'Music'))
);
const STATE_FILE = path.resolve(process.env.TAMI_STATE || path.join(os.homedir(), '.tami-companion-state.json'));
const LIB_FILE = path.join(path.dirname(STATE_FILE), 'tami-companion-lib.json');
const MAX_SONGS = 500;
const METADATA_CACHE_MAX = 1200;

const AUDIO_EXT = new Set(['.mp3', '.m4a', '.aac', '.ogg', '.opus', '.wav', '.flac', '.wma']);
const VIDEO_EXT = new Set(['.mp4', '.mkv', '.webm', '.mov', '.m4v', '.avi']);
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.apk': 'application/vnd.android.package-archive',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mkv': 'video/x-matroska',
  '.webm': 'video/webm', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo'
};

let lastState = null;
const subs = new Set();
let musicCache = { at: 0, songs: [] };
let stateSaveTimer = 0;
let knownPaths = new Set();
let pendingNewlib = null;

function pushEvent(obj) {
  const data = `data: ${JSON.stringify(obj)}\n\n`;
  for (const s of subs) { try { s.write(data); } catch (e) { subs.delete(s); } }
}

// ---------------------------------------------------------------------------
// Música: metadata real (ID3v2 / ID3v1 / MP3 / FLAC / WAV)
// ---------------------------------------------------------------------------

const metaCache = new Map();
// ID3v2 (e MP3) usam "synchsafe": cada byte guarda 7 bits, do mais significativo
// para o menos. n aqui é o inteiro BE lido direto do header.
const SYNCSAFE = (n) => ((n >>> 24 & 0x7f) << 21) | ((n >>> 16 & 0x7f) << 14) | ((n >>> 8 & 0x7f) << 7) | (n & 0x7f);

function readFileRange(file, start, len) {
  return new Promise((res) => {
    fs.open(file, 'r', (err, fd) => {
      if (err) return res(null);
      const buf = Buffer.alloc(Math.min(len, Math.max(0, 1024 * 1024)));
      fs.read(fd, buf, 0, buf.length, Math.max(0, start), (err2, bytesRead) => {
        fs.close(fd, () => {});
        if (err2) return res(null);
        res(bytesRead < buf.length ? buf.slice(0, bytesRead) : buf);
      });
    });
  });
}

function decodeText(buf, enc, start, len) {
  const end = Math.min(buf.length, start + len);
  if (end <= start) return '';
  try {
    if (enc === 1 || enc === 2) {
      // UTF-16 (com ou sem BOM)
      let b = buf.subarray(start, end);
      if (b[0] === 0xff && b[1] === 0xfe) return b.subarray(2).toString('utf16le').replace(/\u0000+$/, '').trim();
      if (b[0] === 0xfe && b[1] === 0xff) {
        // UTF-16BE -> converter para LE
        const c = Buffer.alloc(b.length - 2);
        for (let i = 0; i < c.length; i += 2) { c[i] = b[2 + i + 1]; c[i + 1] = b[2 + i]; }
        return c.toString('utf16le').replace(/\u0000+$/, '').trim();
      }
      return b.toString('utf16le').replace(/\u0000+$/, '').trim();
    }
    if (enc === 0 || enc === 3) {
      // enc 0 = ISO-8859-1 mas vários encoders gravam UTF-8; enc 3 = UTF-8.
      // Se o texto for UTF-8 válido, use UTF-8.
      const b = buf.subarray(start, end);
      const s8 = b.toString('utf8');
      if (!s8.includes('\uFFFD')) return s8.replace(/\0+$/, '').replace(/\s+$/, '').trim();
      return b.toString('latin1').replace(/\0+$/, '').replace(/\s+$/, '').trim();
    }
  } catch (e) { return ''; }
}

function parseID3v2(buf) {
  if (buf.length < 10 || buf.toString('latin1', 0, 3) !== 'ID3') return null;
  const ver = buf[3], size = SYNCSAFE(buf.readUInt32BE(6));
  const out = { title: '', artist: '', album: '' };
  let off = 10;
  if (buf.length < 10 + size) return null;
  if ((buf[5] & 0x40) && (ver === 3 || ver === 4)) {
    const es = ver === 4 ? SYNCSAFE(buf.readUInt32BE(off)) : buf.readUInt32BE(off);
    off += (ver === 4 ? es : 4 + es);
  }
  const map = {};
  while (off + 8 <= buf.length) {
    const id = buf.toString('latin1', off, off + (ver === 2 ? 3 : 4));
    const fszRaw = ver === 2 ? buf.readUIntBE(off + 3, 3) : buf.readUInt32BE(off + 4);
    const fsz = ver === 4 ? SYNCSAFE(fszRaw) : fszRaw;
    const fbody = off + (ver === 2 ? 6 : 10);
    if (!fsz || fsz < 0) break;
    if (fbody + fsz > buf.length) break;
    if (fsz > 0) {
      let rec = map[id] || '';
      if (rec && rec[rec.length - 1] === '/' && rec[rec.length - 2] === '/') rec = rec.slice(0, -2);
      const txt = ver === 2 ? ['TT2', 'TP1', 'TAL'].includes(id) : ['TIT2', 'TPE1', 'TALB'].includes(id);
      if (txt) {
        const enc = buf[fbody];
        const val = decodeText(buf, enc, fbody + 1, fsz - 1);
        if (val) { if (rec) rec += '; '; map[id] = rec + val; }
      }
    }
    off = fbody + fsz;
  }
  const pick = ver === 2 ? ['TT2', 'TP1', 'TAL'] : ['TIT2', 'TPE1', 'TALB'];
  out.title = map[pick[0]] || '';
  out.artist = map[pick[1]] || '';
  out.album = map[pick[2]] || '';
  return out;
}

function parseID3v1(buf) {
  if (!buf || buf.length < 128) return null;
  const s = buf.subarray(buf.length - 128);
  if (s.toString('latin1', 0, 3) !== 'TAG') return null;
  const str = (a, l) => s.toString('latin1', a, a + l).replace(/\0.*$/, '').trim();
  const title = str(3, 30), artist = str(33, 30), album = str(63, 30);
  if (!title && !artist && !album) return null;
  return { title, artist, album };
}

const BR_MPEG1 = [
  [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448], // Layer I
  [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],    // Layer II
  [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]      // Layer III
];
const BR_MPEG2 = [
  [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],    // Layer I
  [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],         // Layer II
  [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]          // Layer III
];
const SR1 = [44100, 48000, 32000];

// Cabeçalho de frame MPEG: 11 bits sync + 2 versão + 2 layer + 1 proteção,
// depois 4 bitrate + 2 sample rate + 1 padding + 1 private + 2 modo + ...
function mp3FrameAt(buf, start) {
  for (let i = start; i + 4 <= buf.length; i++) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) continue;
    const b = buf.readUInt16BE(i);
    const c = buf.readUInt16BE(i + 2);
    const ver = (b >> 3) & 3;
    const layer = (b >> 1) & 3;      // 1=III, 2=II, 3=I
    const brI = (c >> 12) & 15;
    const srI = (c >> 10) & 3;
    const pad = (c >> 9) & 1;
    if (ver === 1 || layer < 1 || layer > 3 || brI === 0 || brI === 15 || srI === 3) continue;
    const isMPEG1 = ver === 3;
    const li = layer === 3 ? 0 : (layer === 2 ? 1 : 2);
    const bitrate = (isMPEG1 ? BR_MPEG1 : BR_MPEG2)[li][brI] * 1000;
    const baseSR = SR1[srI];
    const srate = isMPEG1 ? baseSR : (ver === 2 ? baseSR / 2 : baseSR / 4);
    const spf = layer === 3 ? 384 : 1152;
    const flen = layer === 3
      ? Math.floor((12 * bitrate / srate + pad) * 4)
      : Math.floor(144 * bitrate / srate + pad);
    if (flen < 24 || flen > 2880) continue;
    const mono = ((c >> 6) & 3) === 3;
    return { off: i, bitrate, srate, spf };
  }
  return null;
}

function avgBitrate(file, audioStart, audioSize) {
  return new Promise((res) => {
    const samples = [0, 0.25, 0.5, 0.75, 0.9];
    let i = 0, sum = 0, n = 0;
    const next = () => {
      if (i >= samples.length) return res(n ? Math.round(sum / n) : 0);
      const at = Math.min(audioStart + Math.floor(samples[i] * audioSize), Math.max(audioStart, audioStart + audioSize - 8192));
      readFileRange(file, Math.max(0, at), 16384).then((buf) => {
        if (buf) {
          const f = mp3FrameAt(buf, 0);
          if (f && f.bitrate) { sum += f.bitrate; n++; }
        }
        i++;
        next();
      });
    };
    next();
  });
}

async function mp3Duration(file, audioStart, audioSize, first) {
  const f = mp3FrameAt(first, 0);
  if (!f) return 0;
  const end = Math.min(first.length, f.off + 4 + 1024);
  for (let j = f.off + 4; j + 12 <= end; j++) {
    const tag = first.toString('latin1', j, j + 4);
    if (tag === 'Xing' || tag === 'Info') {
      const flags = first.readUInt32BE(j + 4);
      if (flags & 1) {
        const frames = first.readUInt32BE(j + 8);
        if (frames > 0) return Math.round((frames * f.spf) / f.srate * 1000);
      }
      break;
    }
  }
  const br = await avgBitrate(file, audioStart, audioSize);
  if (!br) return 0;
  return Math.round((audioSize * 8) / br * 1000);
}

function flacMeta(buf) {
  const out = { durationMs: 0, title: '', artist: '', album: '' };
  if (buf.length < 4 || buf.toString('latin1', 0, 4) !== 'fLaC') return out;
  let off = 4;
  while (off + 4 <= buf.length) {
    const last = buf[off] & 0x80, type = buf[off] & 0x7f;
    const len = (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3];
    const data = off + 4;
    if (data + len > buf.length) break;
    if (type === 0 && len >= 34) {
      // STREAMINFO: sample rate (20 bits) e total de samples (36 bits)
      const srate = (buf[data + 10] << 12) | (buf[data + 11] << 4) | (buf[data + 12] >> 4);
      const total = ((buf[data + 13] & 0x0f) * 0x100000000) + (buf[data + 14] * 0x1000000) + (buf[data + 15] * 0x10000) + (buf[data + 16] << 8) + buf[data + 17];
      if (srate > 0 && total > 0) out.durationMs = Math.round(total / srate * 1000);
    } else if (type === 4) {
      // VORBIS_COMMENT: vendor + pares "CHAVE=valor"
      const vendLen = buf.readUInt32LE(data);
      let p = data + 4 + vendLen, end = data + len;
      if (p + 4 <= end) {
        const count = buf.readUInt32LE(p); p += 4;
        for (let i = 0; i < count && p + 4 <= end; i++) {
          const el = buf.readUInt32LE(p); p += 4;
          if (p + el > end) break;
          const kv = buf.toString('latin1', p, p + el); p += el;
          const eq = kv.indexOf('=');
          if (eq <= 0) continue;
          const k = kv.slice(0, eq).toUpperCase(), v = kv.slice(eq + 1);
          if (k === 'TITLE' && !out.title) out.title = v;
          else if (k === 'ARTIST' && !out.artist) out.artist = v;
          else if (k === 'ALBUM' && !out.album) out.album = v;
        }
      }
    }
    off = data + len;
    if (last) break;
  }
  return out;
}

function wavMeta(buf) {
  const out = { durationMs: 0, title: '', artist: '', album: '' };
  if (buf.length < 12 || buf.toString('latin1', 8, 12) !== 'WAVE') return out;
  let off = 12, byteRate = 0, dataSize = 0;
  while (off + 8 <= buf.length) {
    const id = buf.toString('latin1', off, off + 4);
    const len = buf.readUInt32LE(off + 4);
    const data = off + 8;
    if (data + len > buf.length) break;
    if (id === 'fmt ' && len >= 16) byteRate = buf.readUInt32LE(data + 8);
    else if (id === 'data') { dataSize = len; break; }
    else if (id === 'LIST') {
      // LIST/INFO: INAM=título, IART=artista, IPRD=álbum
      if (buf.toString('latin1', data, data + 4) !== 'INFO') { off = data + len + (len % 2); continue; }
      let p = data + 4, end = data + len;
      while (p + 8 <= end) {
        const sid = buf.toString('latin1', p, p + 4);
        const slen = buf.readUInt32LE(p + 4);
        const sdata = p + 8;
        if (sdata + slen > end) break;
        const v = buf.toString('utf8', sdata, sdata + slen).replace(/\0.*$/, '').replace(/\s+$/, '').trim();
        if (sid === 'INAM' && !out.title) out.title = v;
        else if (sid === 'IART' && !out.artist) out.artist = v;
        else if (sid === 'IPRD' && !out.album) out.album = v;
        p = sdata + slen + (slen % 2);
      }
    }
    off = data + len + (len % 2);
  }
  if (byteRate > 0 && dataSize > 0) out.durationMs = Math.round(dataSize / byteRate * 1000);
  return out;
}

async function songMeta(file, size, mtime) {
  const key = file + '|' + mtime + '|' + size;
  const hit = metaCache.get(key);
  if (hit) return hit;

  const ext = path.extname(file).toLowerCase();
  const meta = { title: '', artist: '', album: '', durationMs: 0 };

  if (size > 0 && (ext === '.mp3' || ext === '.flac' || ext === '.wav')) {
    const head = await readFileRange(file, 0, 16);
    if (!head) { metaCache.set(key, meta); return meta; }

    let audioStart = 0, id3 = null;
    if (ext === '.mp3') {
      if (head.toString('latin1', 0, 3) === 'ID3') {
        const id3v2size = SYNCSAFE(head.readUInt32BE(6)); // inclui 10 do header
        const id3v2 = await readFileRange(file, 0, Math.min(10 + id3v2size, 1024 * 1024));
        if (id3v2) id3 = parseID3v2(id3v2);
        audioStart = 10 + id3v2size;
      }
      const audioSize = Math.max(0, size - audioStart);
      const first = await readFileRange(file, audioStart, 65536);
      if (first) meta.durationMs = await mp3Duration(file, audioStart, audioSize, first);
      if (!id3) {
        const tail = await readFileRange(file, Math.max(0, size - 128), 128);
        const v1 = parseID3v1(tail);
        if (v1) id3 = v1;
      }
      if (id3) { meta.title = id3.title; meta.artist = id3.artist; meta.album = id3.album; }
    } else if (ext === '.flac') {
      const buf = await readFileRange(file, 0, 256 * 1024);
      if (buf) {
        const fm = flacMeta(buf);
        meta.title = fm.title; meta.artist = fm.artist; meta.album = fm.album; meta.durationMs = fm.durationMs;
      }
    } else if (ext === '.wav') {
      const buf = await readFileRange(file, 0, 256 * 1024);
      if (buf) {
        const wm = wavMeta(buf);
        meta.title = wm.title; meta.artist = wm.artist; meta.album = wm.album; meta.durationMs = wm.durationMs;
      }
    }
  }

  metaCache.set(key, meta);
  if (metaCache.size > METADATA_CACHE_MAX) {
    const it = metaCache.keys().next().value;
    if (it !== undefined) metaCache.delete(it);
  }
  return meta;
}

async function fillMeta(songs) {
  const todo = songs.filter((s) => !s._done);
  if (!todo.length) return;
  await Promise.all(todo.map(async (s) => {
    try {
      const m = await songMeta(s.path, s.size, s.mtimeMs);
      if (m) {
        s.title = m.title || s.title;
        s.artist = m.artist || s.artist;
        s.album = m.album || s.album;
        s.durationMs = m.durationMs || s.durationMs;
      }
    } catch (e) {}
    s._done = true;
  }));
}

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
        const vExt = VIDEO_EXT.has(ext);
        if (!AUDIO_EXT.has(ext) && !vExt) continue;
        let st = null;
        try { st = fs.statSync(full); } catch (e) { continue; }
        const base = e.name.slice(0, -ext.length).trim();
        const parts = base.split(/\s*-\s*/);
        const fallbackTitle = parts.length > 1 ? parts.slice(1).join(' -').trim() : base;
        const fallbackArtist = parts.length > 1 ? parts[0].trim() : '';
        out.push({
          id: String(out.length),
          title: fallbackTitle, artist: fallbackArtist, album: '',
          durationMs: 0, type: vExt ? 'video' : 'song',
          name: e.name, size: st.size, path: full, mtimeMs: st.mtimeMs, _done: false
        });
      }
    };
    walk(MUSIC);
  }
  musicCache = { at: now, songs: out };

  if (knownPaths.size === 0 && out.length) {
    for (const s of out) knownPaths.add(s.path);
    saveLib();
  } else {
    const fresh = out.filter((s) => !knownPaths.has(s.path));
    if (fresh.length) {
      for (const s of fresh) knownPaths.add(s.path);
      saveLib();
      const freshAudio = fresh.filter((s) => s.type === 'song');
      if (freshAudio.length) {
        const evt = {
          cmd: 'newlib',
          value: {
            count: freshAudio.length,
            ids: freshAudio.map((s) => s.id),
            names: freshAudio.map((s) => s.name).slice(0, 8)
          }
        };
        if (subs.size) pushEvent(evt);
        else pendingNewlib = evt;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Estado persistido do player
// ---------------------------------------------------------------------------

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const d = JSON.parse(raw);
    if (d && typeof d === 'object') {
      lastState = d;
      if (lastState.state) lastState.state.ts = lastState.state.ts || (Date.now() / 1000);
    }
  } catch (e) {}
}
function saveState() {
  if (!lastState) return;
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(lastState), 'utf8');
  } catch (e) {}
}
function scheduleSaveState() {
  clearTimeout(stateSaveTimer);
  stateSaveTimer = setTimeout(saveState, 1200);
}

function loadLib() {
  try {
    const d = JSON.parse(fs.readFileSync(LIB_FILE, 'utf8'));
    if (Array.isArray(d)) knownPaths = new Set(d);
  } catch (e) {}
}
function saveLib() {
  try {
    fs.mkdirSync(path.dirname(LIB_FILE), { recursive: true });
    fs.writeFileSync(LIB_FILE, JSON.stringify([...knownPaths]), 'utf8');
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

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

function serveMedia(req, res, p, kind) {
  const m = p.match(/^\/api\/(audio|video)\/(\d+)$/);
  if (!m || (kind && m[1] !== kind)) { sendJSON(res, 404, { error: 'not found' }); return; }
  const items = scanMusic();
  const want = m[1] === 'audio' ? 'song' : 'video';
  const item = items.find((s) => s.id === m[2] && s.type === want);
  if (!item) { sendJSON(res, 404, { error: 'not found' }); return; }
  let st;
  try { st = fs.statSync(item.path); } catch (e) { sendJSON(res, 404, { error: 'not found' }); return; }
  const ctype = MIME[path.extname(item.path).toLowerCase()] || 'application/octet-stream';
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
          'content-type': ctype,
          'accept-ranges': 'bytes',
          'content-range': `bytes ${start}-${end}/${st.size}`,
          'content-length': len
        });
        fs.createReadStream(item.path, { start, end }).pipe(res);
        return;
      }
    }
  }
  res.writeHead(200, { 'content-type': ctype, 'content-length': st.size, 'accept-ranges': 'bytes' });
  fs.createReadStream(item.path).pipe(res);
}

async function stateJSON(req) {
  const all = scanMusic();
  await fillMeta(all);
  const songs = all.filter((s) => s.type === 'song').map((s) => ({
    id: s.id, title: s.title, artist: s.artist, album: s.album,
    durationMs: s.durationMs, type: 'song',
    url: songURL(req, s.id)
  }));
  const videos = all.filter((s) => s.type === 'video').map((s) => ({
    id: s.id, title: s.title, artist: s.artist, album: s.album,
    durationMs: s.durationMs, type: 'video',
    url: songURL(req, s.id, 'video')
  }));
  const inst = lastState;
  return {
    dev: inst && inst.dev ? inst.dev : os.hostname(),
    state: inst ? { ...(inst.state || {}), ts: inst.ts } : null,
    songs: { songs, videos },
    server: { url: baseURL(req), publicUrl: PUBLIC_URL || baseURL(req) }
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

const PUBLIC_URL = (process.env.TAMI_PUBLIC_URL || '').trim().replace(/\/+$/, '');
function baseURL(req) {
  if (PUBLIC_URL) return PUBLIC_URL;
  let proto = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
  const cfv = req.headers['cf-visitor'];
  if (cfv) { try { proto = (JSON.parse(String(cfv)).scheme || proto).toString(); } catch (e) {} }
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (host) return `${proto}://${host}`;
  return `http://${LAN_IP()}:${PORT}`;
}
function songURL(req, id, kind) {
  return `${baseURL(req)}/api/${kind === 'video' ? 'video' : 'audio'}/${id}`;
}

// ---------------------------------------------------------------------------
// Salas (watch party na LAN)
//   host cria a sala (POST /api/room), convidados entram por código.
//   O host publica o "palco" (vídeo do servidor ou URL) e relay de play/pause/seek.
// ---------------------------------------------------------------------------

const ROOM_IDLE_MS = 10 * 60 * 1000;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I/O/L/0/1
const rooms = new Map();

function roomCode() {
  let s;
  do {
    s = '';
    for (let i = 0; i < 4; i++) s += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  } while (rooms.has(s));
  return s;
}
function roomKey() {
  const cs = 'abcdef0123456789';
  let s = '';
  for (let i = 0; i < 32; i++) s += cs[Math.floor(Math.random() * cs.length)];
  return s;
}
function roomSnapshot(code) {
  const r = rooms.get(code);
  if (!r) return null;
  return {
    code: r.code,
    host: r.host,
    media: r.media,
    playing: r.playing,
    positionMs: r.positionMs,
    ts: r.ts,
    members: [...r.members.keys()].map((k) => ({ nick: k })),
    messages: r.messages
  };
}
function roomPush(code, obj) {
  const r = rooms.get(code);
  if (!r) return;
  const data = `data: ${JSON.stringify(obj)}\n\n`;
  for (const s of r.subs) { try { s.write(data); } catch (e) { r.subs.delete(s); } }
}
function roomClose(code) {
  const r = rooms.get(code);
  if (!r) return;
  roomPush(code, { cmd: 'roomClosed' });
  for (const s of r.subs) { try { s.end(); } catch (e) {} }
  r.subs.clear();
  rooms.delete(code);
}
function roomExpiry() {
  const now = Date.now();
  for (const [code, r] of rooms) {
    if (now - r.lastSeen > ROOM_IDLE_MS) {
      roomPush(code, { cmd: 'roomClosed' });
      for (const s of r.subs) { try { s.end(); } catch (e) {} }
      rooms.delete(code);
    }
  }
}

const server = http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;

  if (req.method === 'OPTIONS') { sendCORS(res); res.writeHead(204); res.end(); return; }

  if (p === '/__companion__') {
    sendJSON(res, 200, { name: 'tami-companion', port: PORT, url: baseURL(req), publicUrl: PUBLIC_URL || baseURL(req) });
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
        scheduleSaveState();
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
    if (pendingNewlib) {
      try { res.write(`data: ${JSON.stringify(pendingNewlib)}\n\n`); } catch (e) {}
      pendingNewlib = null;
    }
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
    stateJSON(req).then((d) => sendJSON(res, 200, d));
    return;
  }

  const rm = p.match(/^\/api\/room(?:\/([A-Z0-9]+))?(\/(?:join|leave|cmd|msg|events|ping))?$/);
  if (rm) {
    if (!rm[1] && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 8192) req.destroy(); });
      req.on('end', () => {
        try {
          const d = JSON.parse(body || '{}');
          const code = roomCode();
          const key = roomKey();
          const nick = String(d.nick || 'Anfitrião').slice(0, 32);
          const members = new Map();
          members.set(nick, Date.now());
          rooms.set(code, {
            code, key,
            host: { nick },
            media: null, playing: false, positionMs: 0, ts: 0,
            lastSeen: Date.now(), members, subs: new Set(),
            messages: []
          });
          sendJSON(res, 200, { ok: true, code, key });
        } catch (e) { sendJSON(res, 400, { error: 'bad' }); }
      });
      return;
    }

    const code = rm[1];
    const r = rooms.get(code);
    if (!r) { sendJSON(res, 404, { error: 'no room' }); return; }

    if (req.method === 'GET') {
      if (rm[2] === '/events') {
        sendCORS(res);
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive'
        });
        res.write(': connected\n\n');
        r.subs.add(res);
        const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 15000);
        req.on('close', () => { clearInterval(ping); r.subs.delete(res); });
        return;
      }
      sendJSON(res, 200, roomSnapshot(code));
      return;
    }

    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 8192) req.destroy(); });
    req.on('end', () => {
      let d = {};
      try { d = JSON.parse(body || '{}'); } catch (e) {}
      if (rm[2] === '/join') {
        const nick = String(d.nick || 'Convidado').slice(0, 32);
        if (!r.members.has(nick)) {
          if (r.members.size >= 32) r.members.delete([...r.members.keys()][0]);
          r.members.set(nick, Date.now());
        }
        r.lastSeen = Date.now();
        sendJSON(res, 200, roomSnapshot(code));
        return;
      }
      if (rm[2] === '/leave') {
        r.members.delete(String(d.nick || ''));
        r.lastSeen = Date.now();
        sendJSON(res, 200, { ok: true });
        return;
      }
      if (rm[2] === '/msg') {
        const nick = String(d.nick || '').trim().slice(0, 32);
        const text = String(d.text || '').trim().slice(0, 500);
        if (!nick || !text) { sendJSON(res, 400, { error: 'empty' }); return; }
        const msg = { t: Date.now(), nick, text };
        r.messages.push(msg);
        if (r.messages.length > 150) r.messages = r.messages.slice(-150);
        r.lastSeen = Date.now();
        roomPush(code, { cmd: 'msg', ...msg });
        sendJSON(res, 200, { ok: true, msg });
        return;
      }
      if (rm[2] === '/ping') {
        if (d.key !== r.key) { sendJSON(res, 403, { error: 'no' }); return; }
        r.lastSeen = Date.now();
        sendJSON(res, 200, { ok: true });
        return;
      }
      if (rm[2] === '/cmd') {
        if (d.key !== r.key) { sendJSON(res, 403, { error: 'no' }); return; }
        const ev = d.evt || null;
        if (ev && ev.cmd) {
          if (ev.cmd === 'media') {
            r.media = ev.media || null;
            r.playing = false;
            r.positionMs = Number(ev.positionMs) || 0;
            r.ts = Date.now();
          } else if (ev.cmd === 'sync') {
            r.playing = !!ev.playing;
            r.positionMs = Number(ev.positionMs) || 0;
            r.ts = Date.now();
          }
          r.lastSeen = Date.now();
          roomPush(code, ev);
          if (ev.cmd === 'close') roomClose(code);
        }
        sendJSON(res, 200, { ok: true });
        return;
      }
      sendJSON(res, 404, { error: 'no' });
    });
    return;
  }

  if (p.startsWith('/api/audio/')) { serveMedia(req, res, p, 'audio'); return; }
  if (p.startsWith('/api/video/')) { serveMedia(req, res, p, 'video'); return; }

  serveStatic(req, res, p);
});

setInterval(scanMusic, 10000).unref();
setInterval(roomExpiry, 30000).unref();

server.listen(PORT, () => {
  console.log('TAMI Companion no ar!');
  console.log(`  Abra no PC  : http://localhost:${PORT}/`);
  console.log(`  No celular  : aba "Celular" do app => http://${LAN_IP()}:${PORT}`);
  console.log(`  Músicas     : ${MUSIC}${fs.existsSync(MUSIC) ? '' : '  (pasta vazia. Use TAMI_MUSIC=/caminho ou coloque músicas em ~/Music)'}`);
  if (PUBLIC_URL) console.log(`  Acesso externo (configurado): ${PUBLIC_URL}`);
  console.log('  Dica: para acessar de outro estado, use Tailscale/ZeroTier no PC e no celular,');
  console.log('        ou exponha esta porta num túnel (Cloudflare Tunnel, ngrok, bore).');
});
loadState();
loadLib();
scanMusic();