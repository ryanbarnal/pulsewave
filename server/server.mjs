// Pulsewave Server: a private family music server.
// Created by Ryan Ocbina Barnal. GPL-3.0.
import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseFile } from "music-metadata";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VERSION = "1.3.0";
const PORT = +(process.env.PORT || 8095);
const MUSIC_DIR = path.resolve(process.env.MUSIC_DIR || "/music");
const DATA_DIR = path.resolve(process.env.DATA_DIR || "/data");
const WEB_DIR = path.resolve(process.env.WEB_DIR || path.join(HERE, "..", "web"));
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(MUSIC_DIR, "Pulsewave Uploads"));
const SERVER_NAME = process.env.SERVER_NAME || "Family Music";
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/+$/, "");   // e.g. https://media.ryanbarnal.com
const TRUST_PROXY = !!process.env.TRUST_PROXY;                          // behind Cloudflare Tunnel: use the visitor's real IP
const RESCAN_HOURS = +(process.env.RESCAN_HOURS || 6);
const AUDIO_EXT = new Set([".mp3", ".m4a", ".aac", ".flac", ".ogg", ".oga", ".opus", ".wav", ".webm", ".alac", ".aiff", ".aif"]);
const MIME = {
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".flac": "audio/flac", ".ogg": "audio/ogg", ".oga": "audio/ogg",
  ".opus": "audio/ogg", ".wav": "audio/wav", ".webm": "audio/webm", ".alac": "audio/mp4", ".aiff": "audio/aiff", ".aif": "audio/aiff",
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8", ".lrc": "text/plain; charset=utf-8", ".mp4": "video/mp4"
};
const COVER_NAMES = ["cover.jpg", "cover.jpeg", "cover.png", "folder.jpg", "folder.png", "front.jpg", "album.jpg", "albumart.jpg"];

for (const d of ["", "art", "lyrics", "emb", "users"]) fs.mkdirSync(path.join(DATA_DIR, d), { recursive: true });
const log = (...a) => console.log(new Date().toISOString(), ...a);

/* ---------------- small JSON store ---------------- */
const fileOf = n => path.join(DATA_DIR, n + ".json");
function load(n, d) { try { return JSON.parse(fs.readFileSync(fileOf(n), "utf8")); } catch { return d; } }
function save(n, v) { const f = fileOf(n), t = f + ".tmp"; fs.writeFileSync(t, JSON.stringify(v)); fs.renameSync(t, f); }
const db = {
  users: load("users", {}),          // name -> { hash, salt, admin, upload, created, lastSeen }
  sessions: load("sessions", {}),    // sha256(token) -> { user, created, seen }
  library: load("library", { songs: {}, scannedAt: 0 }),
  hidden: load("hidden", {}),        // song id -> true (removed by admin)
  shares: load("shares", {})         // listen-link id -> { owner, playlistId, created }
};
const saveUsers = () => save("users", db.users);
let sessT = 0; const saveSessions = () => { clearTimeout(sessT); sessT = setTimeout(() => save("sessions", db.sessions), 2000); };

/* ---------------- accounts ---------------- */
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64).toString("hex");
const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const validName = n => typeof n === "string" && /^[\p{L}\p{N} ._-]{1,32}$/u.test(n.trim());
const publicUser = (name, u) => ({ name, admin: !!u.admin, upload: !!u.upload, created: u.created, lastSeen: u.lastSeen || 0 });
function createUser(name, pw, opts = {}) {
  const salt = crypto.randomBytes(16).toString("hex");
  db.users[name] = { hash: hashPw(pw, salt), salt, admin: !!opts.admin, upload: !!opts.upload || !!opts.admin, created: Date.now() };
  saveUsers();
}
function checkPw(name, pw) {
  const u = db.users[name]; if (!u) { hashPw(pw, "x".repeat(32)); return false; }   // same work either way
  const a = Buffer.from(hashPw(pw, u.salt), "hex"), b = Buffer.from(u.hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function newSession(name) {
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions[sha(token)] = { user: name, created: Date.now(), seen: Date.now() };
  if (db.users[name]) { db.users[name].lastSeen = Date.now(); saveUsers(); }
  saveSessions(); return token;
}
const SESSION_DAYS = 180;
function auth(req, url) {
  const h = req.headers.authorization || "", t = h.startsWith("Bearer ") ? h.slice(7) : url.searchParams.get("t");
  if (!t || !/^[0-9a-f]{64}$/.test(t)) return null;
  const s = db.sessions[sha(t)]; if (!s) return null;
  const u = db.users[s.user];
  if (!u || Date.now() - s.seen > SESSION_DAYS * 864e5) { delete db.sessions[sha(t)]; saveSessions(); return null; }
  if (Date.now() - s.seen > 60e3) { s.seen = Date.now(); u.lastSeen = s.seen; saveSessions(); }
  return { name: s.user, ...u, tokenHash: sha(t) };
}
// brute-force protection: 10 failed logins per IP per 15 minutes
const fails = new Map();
const ipOf = req => (TRUST_PROXY && (req.headers["cf-connecting-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0].trim())) || (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
const tooMany = ip => { const f = fails.get(ip); return f && f.n >= 10 && Date.now() - f.t < 15 * 60e3; };
const failed = ip => { const f = fails.get(ip); if (!f || Date.now() - f.t > 15 * 60e3) fails.set(ip, { n: 1, t: Date.now() }); else f.n++; };

/* ---------------- music library scan ---------------- */
let scanning = false, scanStats = { done: 0, total: 0 };
async function walk(dir, out) {
  let ents; try { ents = await fsp.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (e.name.startsWith(".") || e.name === "@Recycle" || e.name === "@Recently-Snapshot" || e.name === ".@__thumb") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (AUDIO_EXT.has(path.extname(e.name).toLowerCase())) out.push(p);
  }
}
const idOf = rel => sha("song:" + rel).slice(0, 20);
function lyricText(common) {
  const l = common.lyrics; if (!l || !l.length) return null;
  const x = l[0];
  if (typeof x === "string") return x;
  if (x.syncText && x.syncText.length) return x.syncText.map(s => { const t = (s.timestamp || 0) / 1000, m = Math.floor(t / 60); return `[${String(m).padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}] ${s.text}`; }).join("\n");
  return x.text || null;
}
// Read one song's tags, cover art and lyrics
async function readSong(abs, st, prev) {
  const rel = path.relative(path.dirname(MUSIC_DIR), abs), id = idOf(rel);
  const base = path.basename(abs, path.extname(abs));
  const song = { id, abs, rel, fname: path.basename(abs), size: st.size, mtime: st.mtimeMs, added: prev ? prev.added : Date.now(),
    title: base, artist: "Unknown artist", album: "", duration: 0, year: "", genre: "", track: 0, art: null, lrc: null };
  const m = base.split(" - "); if (m.length > 1) { song.artist = m[0].trim(); song.title = m.slice(1).join(" - ").trim(); }
  try {
    const md = await parseFile(abs, { duration: true });
    const c = md.common;
    if (c.title) song.title = c.title;
    if (c.artist || c.albumartist) song.artist = c.artist || c.albumartist;
    if (c.album) song.album = c.album;
    if (c.year) song.year = String(c.year);
    if (c.genre && c.genre[0]) song.genre = c.genre[0];
    if (c.track && c.track.no) song.track = c.track.no;
    song.duration = md.format.duration || 0;
    const pic = c.picture && c.picture[0];
    if (pic && pic.data && pic.data.length) {
      const ext = /png/.test(pic.format) ? ".png" : /webp/.test(pic.format) ? ".webp" : ".jpg";
      await fsp.writeFile(path.join(DATA_DIR, "art", id + ext), pic.data); song.art = id + ext;
    }
    const lt = lyricText(c);
    if (lt) { await fsp.writeFile(path.join(DATA_DIR, "emb", id + ".lrc"), lt); song.lrc = "emb"; }
  } catch (e) { /* unreadable tags: keep file-name info */ }
  if (!song.art) for (const n of COVER_NAMES) { const p = path.join(path.dirname(abs), n); if (fs.existsSync(p)) { song.art = "dir:" + p; break; } }
  const side = path.join(path.dirname(abs), base + ".lrc");
  if (fs.existsSync(side)) song.lrc = "side";
  return song;
}
const persistLibrary = () => save("library", { songs: Object.fromEntries(Object.entries(db.library.songs).map(([k, v]) => [k, { ...v, abs: undefined }])), scannedAt: db.library.scannedAt });
async function scan() {
  if (scanning) return; scanning = true;
  const t0 = Date.now(), files = [], roots = [MUSIC_DIR];
  if (!UPLOAD_DIR.startsWith(MUSIC_DIR + path.sep)) roots.push(UPLOAD_DIR);
  for (const r of roots) await walk(r, files);
  const old = db.library.songs, next = {};
  scanStats = { done: 0, total: files.length };
  for (const abs of files) {
    scanStats.done++;
    const rel = path.relative(path.dirname(MUSIC_DIR), abs), id = idOf(rel);
    let st; try { st = await fsp.stat(abs); } catch { continue; }
    const prev = old[id];
    if (prev && prev.size === st.size && prev.mtime === st.mtimeMs) { next[id] = { ...prev, abs }; continue; }
    next[id] = await readSong(abs, st, prev);
  }
  // keep songs uploaded while this scan was running (the scan may have passed their folder already)
  for (const [id, s] of Object.entries(db.library.songs)) if (!next[id] && s.uploader && fs.existsSync(s.abs)) next[id] = s;
  db.library = { songs: next, scannedAt: Date.now() };
  persistLibrary();
  scanning = false;
  log(`scan: ${Object.keys(next).length} songs in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
// restore absolute paths for the cached library
for (const s of Object.values(db.library.songs)) s.abs = path.join(path.dirname(MUSIC_DIR), s.rel);
const songOut = s => ({ id: s.id, title: s.title, artist: s.artist, album: s.album, duration: s.duration, year: s.year, genre: s.genre, track: s.track,
  fname: s.fname, size: s.size, added: s.added, hasArt: !!s.art, hasLrc: !!s.lrc || fs.existsSync(path.join(DATA_DIR, "lyrics", s.id + ".lrc")), uploader: s.uploader });

/* ---------------- per-user data (favorites, playlists, folders) ---------------- */
const userFile = n => path.join(DATA_DIR, "users", sha("u:" + n).slice(0, 24) + ".json");
const readUser = n => { try { return JSON.parse(fs.readFileSync(userFile(n), "utf8")); } catch { return { favs: [], plays: {}, playlists: [], folders: [] }; } };
const writeUser = (n, d) => { const f = userFile(n); fs.writeFileSync(f + ".tmp", JSON.stringify(d)); fs.renameSync(f + ".tmp", f); };

// Listen links: anyone with the link can play that one playlist (always the owner's current version)
function shareSongs(id) {
  const sh = db.shares[id]; if (!sh || !db.users[sh.owner]) return null;
  const pl = (readUser(sh.owner).playlists || []).find(x => x.id === sh.playlistId); if (!pl) return null;
  const songs = (pl.songIds || []).map(i => db.library.songs[i]).filter(s => s && !db.hidden[s.id]);
  return { share: sh, pl, songs, ids: new Set(songs.map(s => s.id)) };
}

/* ---------------- HTTP helpers ---------------- */
function send(res, code, body, headers = {}) {
  const isObj = body && typeof body === "object" && !Buffer.isBuffer(body);
  res.writeHead(code, { "Content-Type": isObj ? "application/json" : "text/plain; charset=utf-8", ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}
const err = (res, code, msg) => send(res, code, { error: msg });
function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on("data", c => { n += c.length; if (n > limit) { reject(new Error("too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks))); req.on("error", reject);
  });
}
const readJson = async req => { try { return JSON.parse((await readBody(req)).toString("utf8") || "{}"); } catch { return {}; } };
function serveFile(req, res, file, type, extra = {}) {
  let st; try { st = fs.statSync(file); } catch { return err(res, 404, "Not found"); }
  const range = req.headers.range, size = st.size;
  const base = { "Content-Type": type, "Accept-Ranges": "bytes", "Last-Modified": st.mtime.toUTCString(), ...extra };
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range); let start = m && m[1] ? +m[1] : 0, end = m && m[2] ? +m[2] : size - 1;
    if (m && !m[1] && m[2]) { start = Math.max(0, size - +m[2]); end = size - 1; }
    if (start >= size || end < start) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
    end = Math.min(end, size - 1);
    res.writeHead(206, { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...base, "Content-Length": size });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  }
}
const safeName = n => String(n || "").replace(/[\/\\:*?"<>|\x00-\x1f]/g, "_").replace(/^\.+/, "").slice(0, 150).trim();

/* ---------------- routes ---------------- */
async function api(req, res, url) {
  const p = url.pathname.replace(/^\/api\//, ""), M = req.method, ip = ipOf(req);
  if (p === "info") return send(res, 200, { pulsewaveServer: true, name: SERVER_NAME, version: VERSION, setup: Object.keys(db.users).length === 0, publicUrl: PUBLIC_URL || null });

  if (p === "setup" && M === "POST") {
    if (Object.keys(db.users).length) return err(res, 403, "Already set up");
    const b = await readJson(req);
    if (!validName(b.name) || !b.password || String(b.password).length < 8) return err(res, 400, "Choose a name and a password of at least 8 characters");
    createUser(b.name.trim(), b.password, { admin: true });
    log(`setup: admin "${b.name.trim()}" created`);
    return send(res, 200, { token: newSession(b.name.trim()), user: publicUser(b.name.trim(), db.users[b.name.trim()]) });
  }
  if (p === "login" && M === "POST") {
    if (tooMany(ip)) return err(res, 429, "Too many attempts. Wait 15 minutes and try again.");
    const b = await readJson(req), name = String(b.name || "").trim();
    const real = Object.keys(db.users).find(n => n.toLowerCase() === name.toLowerCase()) || name;
    if (!checkPw(real, b.password || "")) { failed(ip); return err(res, 401, "Wrong name or password"); }
    fails.delete(ip);
    return send(res, 200, { token: newSession(real), user: publicUser(real, db.users[real]) });
  }

  let sm;
  if ((sm = /^s\/([A-Za-z0-9_-]{16,40})$/.exec(p)) && M === "GET") {
    const sh = shareSongs(sm[1]); if (!sh) return err(res, 404, "This listen link was turned off or doesn't exist");
    return send(res, 200, { name: sh.pl.name, owner: sh.share.owner, server: SERVER_NAME, songs: sh.songs.map(songOut) });
  }
  const me = auth(req, url);
  const sid = url.searchParams.get("s");
  const viaShare = !me && sid && M === "GET" && /^(stream|art|lyrics)\//.test(p) ? shareSongs(sid) : null;
  if (!me && !viaShare) return err(res, 401, "Please sign in");
  const allowed = id => !viaShare || viaShare.ids.has(id);

  if (p === "logout" && M === "POST") { delete db.sessions[me.tokenHash]; saveSessions(); return send(res, 200, { ok: true }); }
  if (p === "me") return send(res, 200, { user: publicUser(me.name, me) });
  if (p === "password" && M === "POST") {
    const b = await readJson(req);
    if (!checkPw(me.name, b.old || "")) return err(res, 403, "Current password is wrong");
    if (!b.password || String(b.password).length < 8) return err(res, 400, "New password must be at least 8 characters");
    createUser(me.name, b.password, { admin: me.admin, upload: me.upload }); db.users[me.name].created = me.created; saveUsers();
    return send(res, 200, { ok: true });
  }

  if (p === "library") {
    const songs = Object.values(db.library.songs).filter(s => !db.hidden[s.id]).map(songOut);
    return send(res, 200, { songs, scannedAt: db.library.scannedAt, scanning, progress: scanStats });
  }
  let m;
  if ((m = /^stream\/([0-9a-f]{20})$/.exec(p))) {
    const s = db.library.songs[m[1]]; if (!s || db.hidden[s.id] || !allowed(s.id)) return err(res, 404, "Not found");
    return serveFile(req, res, s.abs, MIME[path.extname(s.abs).toLowerCase()] || "application/octet-stream", { "Cache-Control": "private, max-age=86400" });
  }
  if ((m = /^art\/([0-9a-f]{20})$/.exec(p))) {
    const s = db.library.songs[m[1]]; if (!s || !s.art || !allowed(s.id)) return err(res, 404, "No art");
    const f = s.art.startsWith("dir:") ? s.art.slice(4) : path.join(DATA_DIR, "art", s.art);
    return serveFile(req, res, f, MIME[path.extname(f).toLowerCase()] || "image/jpeg", { "Cache-Control": "private, max-age=604800" });
  }
  if ((m = /^lyrics\/([0-9a-f]{20})$/.exec(p))) {
    const s = db.library.songs[m[1]]; if (!s || !allowed(s.id)) return err(res, 404, "Not found");
    const own = path.join(DATA_DIR, "lyrics", s.id + ".lrc");
    if (M === "PUT") {
      const text = (await readBody(req, 512e3)).toString("utf8");
      if (!text.trim()) { try { fs.unlinkSync(own); } catch {} return send(res, 200, { ok: true }); }
      fs.writeFileSync(own, text); log(`lyrics: ${me.name} updated "${s.title}"`);
      return send(res, 200, { ok: true });
    }
    const cands = [own, path.join(path.dirname(s.abs), path.basename(s.abs, path.extname(s.abs)) + ".lrc"), path.join(DATA_DIR, "emb", s.id + ".lrc")];
    for (const f of cands) if (fs.existsSync(f)) return send(res, 200, fs.readFileSync(f, "utf8"));
    return err(res, 404, "No lyrics");
  }
  if (p === "userdata") {
    if (M === "PUT") {
      const b = await readJson(req), d = {
        favs: Array.isArray(b.favs) ? b.favs.slice(0, 50000) : [], plays: b.plays && typeof b.plays === "object" ? b.plays : {},
        playlists: Array.isArray(b.playlists) ? b.playlists.slice(0, 2000) : [], folders: Array.isArray(b.folders) ? b.folders.slice(0, 500) : [], updated: Date.now() };
      writeUser(me.name, d); return send(res, 200, { ok: true, updated: d.updated });
    }
    const d = readUser(me.name), family = [];
    for (const n of Object.keys(db.users)) if (n !== me.name)
      for (const pl of readUser(n).playlists || []) if (pl.shared) family.push({ ...pl, owner: n });
    return send(res, 200, { ...d, family });
  }
  if (p === "shares") {
    if (M === "GET") return send(res, 200, { shares: Object.entries(db.shares).filter(([, s]) => s.owner === me.name).map(([id, s]) => ({ id, ...s })) });
    if (M === "POST") {
      const b = await readJson(req);
      if (!(readUser(me.name).playlists || []).some(x => x.id === b.playlistId)) return err(res, 404, "Save the playlist first, then try again");
      const ex = Object.entries(db.shares).find(([, s]) => s.owner === me.name && s.playlistId === b.playlistId);
      if (ex) return send(res, 200, { id: ex[0] });
      const id = crypto.randomBytes(16).toString("base64url");
      db.shares[id] = { owner: me.name, playlistId: b.playlistId, created: Date.now() }; save("shares", db.shares);
      log(`share: ${me.name} made a listen link`);
      return send(res, 200, { id });
    }
  }
  if ((m = /^shares\/([A-Za-z0-9_-]{16,40})$/.exec(p)) && M === "DELETE") {
    const s = db.shares[m[1]]; if (!s || (s.owner !== me.name && !me.admin)) return err(res, 404, "Not found");
    delete db.shares[m[1]]; save("shares", db.shares); return send(res, 200, { ok: true });
  }
  if (p === "upload" && M === "PUT") {
    if (!me.upload && !me.admin) return err(res, 403, "Ask the admin for permission to add music");
    const name = safeName(url.searchParams.get("name")), folder = safeName(url.searchParams.get("folder") || "");
    if (!name || !AUDIO_EXT.has(path.extname(name).toLowerCase())) return err(res, 400, "Only audio files can be added");
    const dir = path.join(UPLOAD_DIR, safeName(me.name), folder);
    if (!dir.startsWith(UPLOAD_DIR)) return err(res, 400, "Bad folder");
    try { await fsp.mkdir(dir, { recursive: true }); fs.accessSync(dir, fs.constants.W_OK); }
    catch (e) { log(`upload: can't write to ${dir}: ${e.message}`); return err(res, 500, "The server can't save files to the music folder. Check the NAS folder permissions (see the guide)."); }
    const dest = path.join(dir, name), tmp = dest + ".part";
    await new Promise((resolve, reject) => {
      let n = 0; const out = fs.createWriteStream(tmp);
      req.on("data", c => { n += c.length; if (n > 1024 * 1024 * 1024) { req.destroy(); out.destroy(); reject(new Error("too large")); } });
      req.pipe(out); out.on("finish", resolve); out.on("error", reject); req.on("error", reject);
    }).catch(e => { try { fs.unlinkSync(tmp); } catch {} log(`upload failed for ${me.name}: ${e.message}`); throw e; });
    await fsp.rename(tmp, dest);
    // add it to the library right away, no full rescan needed
    const song = await readSong(dest, await fsp.stat(dest), null);
    song.uploader = me.name; delete db.hidden[song.id];
    db.library.songs[song.id] = song; persistLibrary();
    log(`upload: ${me.name} added ${song.rel}`);
    return send(res, 200, { ok: true, id: song.id, song: songOut(song) });
  }
  if (p === "rescan" && M === "POST") {
    if (!me.admin && !me.upload) return err(res, 403, "Admins only");
    const wait = url.searchParams.get("wait") === "1";
    const job = scan().catch(e => log("scan failed", e.message)); if (wait) await job;
    return send(res, 200, { ok: true, scanning });
  }
  if ((m = /^songs\/([0-9a-f]{20})$/.exec(p)) && M === "DELETE") {
    if (!me.admin) return err(res, 403, "Admins only");
    db.hidden[m[1]] = true; save("hidden", db.hidden);
    return send(res, 200, { ok: true });
  }
  if (p === "hidden" && M === "DELETE") {   // bring back everything the admin removed
    if (!me.admin) return err(res, 403, "Admins only");
    db.hidden = {}; save("hidden", db.hidden); return send(res, 200, { ok: true });
  }

  /* ----- admin: family accounts ----- */
  if (p === "users") {
    if (!me.admin) return err(res, 403, "Admins only");
    if (M === "GET") return send(res, 200, { users: Object.entries(db.users).map(([n, u]) => publicUser(n, u)) });
    if (M === "POST") {
      const b = await readJson(req), name = String(b.name || "").trim();
      if (!validName(name)) return err(res, 400, "Names can use letters, numbers, spaces, dots, dashes (max 32)");
      if (Object.keys(db.users).some(n => n.toLowerCase() === name.toLowerCase())) return err(res, 409, "That name is taken");
      if (!b.password || String(b.password).length < 8) return err(res, 400, "Password must be at least 8 characters");
      createUser(name, b.password, { admin: !!b.admin, upload: !!b.upload });
      log(`users: ${me.name} added "${name}"`);
      return send(res, 200, { user: publicUser(name, db.users[name]) });
    }
  }
  if ((m = /^users\/(.+)$/.exec(p))) {
    if (!me.admin) return err(res, 403, "Admins only");
    const name = decodeURIComponent(m[1]), u = db.users[name]; if (!u) return err(res, 404, "No such person");
    if (M === "DELETE") {
      if (name === me.name) return err(res, 400, "You can't remove yourself");
      delete db.users[name]; saveUsers();
      for (const [k, s] of Object.entries(db.shares)) if (s.owner === name) delete db.shares[k]; save("shares", db.shares);
      for (const [k, s] of Object.entries(db.sessions)) if (s.user === name) delete db.sessions[k]; saveSessions();
      log(`users: ${me.name} removed "${name}"`);
      return send(res, 200, { ok: true });
    }
    if (M === "PATCH") {
      const b = await readJson(req);
      if (b.password) { if (String(b.password).length < 8) return err(res, 400, "Password must be at least 8 characters"); const salt = crypto.randomBytes(16).toString("hex"); u.salt = salt; u.hash = hashPw(b.password, salt); for (const [k, s] of Object.entries(db.sessions)) if (s.user === name && k !== me.tokenHash) delete db.sessions[k]; saveSessions(); }
      if (typeof b.admin === "boolean" && name !== me.name) u.admin = b.admin;
      if (typeof b.upload === "boolean") u.upload = b.upload;
      saveUsers(); return send(res, 200, { user: publicUser(name, u) });
    }
  }
  return err(res, 404, "Unknown request");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (url.pathname.startsWith("/api/")) {
    // token-based (no cookies), so any Pulsewave app (website, desktop, phone) may call the server
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Range");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    res.setHeader("Access-Control-Allow-Private-Network", "true");
    res.setHeader("Cache-Control", res.getHeader("Cache-Control") || "no-store");
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    try { return await api(req, res, url); } catch (e) { log("error", e.message); if (!res.headersSent) err(res, 500, "Server error"); else res.end(); return; }
  }
  // the Pulsewave app itself
  let rel = decodeURIComponent(url.pathname); if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(WEB_DIR, path.normalize(rel).replace(/^(\.\.[\/\\])+/, ""));
  if (!file.startsWith(WEB_DIR) || path.basename(file) === "CNAME") return err(res, 404, "Not found");
  const ext = path.extname(file).toLowerCase();
  serveFile(req, res, file, MIME[ext] || "application/octet-stream", { "Cache-Control": ext === ".html" || file.endsWith("sw.js") ? "no-cache" : "public, max-age=3600" });
});

server.listen(PORT, () => {
  log(`Pulsewave Server ${VERSION} "${SERVER_NAME}" on port ${PORT}`);
  log(`music: ${MUSIC_DIR}  data: ${DATA_DIR}  uploads: ${UPLOAD_DIR}`);
  if (PUBLIC_URL) log(`public address: ${PUBLIC_URL}${TRUST_PROXY ? " (behind a proxy/tunnel)" : ""}`);
  if (!Object.keys(db.users).length) log("No accounts yet: open the server in a browser to create the admin account.");
  scan().catch(e => log("scan failed", e.message));
  setInterval(() => scan().catch(() => {}), RESCAN_HOURS * 3600e3);
});
