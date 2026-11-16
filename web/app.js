(() => {
"use strict";
const C = window.APP_CONFIG || { name: "Pulsewave", credit: "Ryan Ocbina Barnal", version: "1.0.0", tagline: "" };
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem("pw." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("pw." + k, JSON.stringify(v)); } catch {} }
};

/* ---------- Branding ---------- */
document.title = C.name;
$$("[data-appname]").forEach(e => e.textContent = C.name);
$$("[data-credit]").forEach(e => e.textContent = C.credit);
$$("[data-version]").forEach(e => e.textContent = C.version);
$$("[data-tagline]").forEach(e => e.textContent = C.tagline);
const it = $(".intro-title");
it.innerHTML = [...C.name].map((ch, i) => `<span style="animation-delay:${0.6 + i * 0.08}s">${ch === " " ? "&nbsp;" : ch}</span>`).join("");

/* ---------- Animated intro (5 styles, chosen in config.js) ---------- */
const INTROS = ["rings", "equalizer", "wave", "glitch", "burst"];
const qs = new URLSearchParams(location.search).get("intro");
const introStyle = INTROS.includes(qs) ? qs : INTROS[+qs - 1] || (INTROS.includes(C.intro) ? C.intro : "rings");
$("#intro").classList.add("intro-" + introStyle);
const ic = $("#introCanvas"), ix = ic.getContext("2d");
let introRunning = true, introT0 = null;
const R = Math.random;
const dots = Array.from({ length: 90 }, () => ({ a: R() * 6.28, r: R() * 600 + 40, s: R() * 0.004 + 0.001, z: R() * 2 + 0.5 }));
const parts = Array.from({ length: 260 }, () => { const a = R() * 6.28, d = 0.6 + R() * 0.8; return { a, d, s: 0.6 + R() * 0.8, h: R() * 50 - 10, z: 1 + R() * 2.5 }; });
const hue = x => `${(350 + x) % 360}`;
const INTRO_DRAW = {
  rings(t, w, h, k, cx, cy) {
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2, amp = 30 + Math.sin(t / 300 + i * 0.7) * 20 + Math.sin(t / 170 + i) * 10;
      const r1 = 120 * k, r2 = (120 + amp) * k;
      ix.strokeStyle = `hsla(${hue(i * 1.2)},90%,62%,.35)`; ix.lineWidth = 3 * k;
      ix.beginPath(); ix.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); ix.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2); ix.stroke();
    }
    dots.forEach(d => {
      d.a += d.s; const x = cx + Math.cos(d.a) * d.r * k, y = cy + Math.sin(d.a) * d.r * 0.6 * k;
      ix.fillStyle = `hsla(${10 + d.r / 14},95%,65%,.7)`; ix.beginPath(); ix.arc(x, y, d.z * k, 0, 7); ix.fill();
    });
  },
  equalizer(t, w, h, k) {          // a wall of EQ bars rises from the floor and dances
    const n = Math.max(24, Math.floor(w / (22 * k))), bw = w / n, grow = Math.min(1, t / 1400);
    for (let i = 0; i < n; i++) {
      const x = i / n, v = 0.25 + 0.35 * Math.abs(Math.sin(t / 260 + i * 0.45)) * (0.6 + 0.4 * Math.sin(t / 900 + x * 6)) + 0.25 * Math.exp(-((x - 0.5) ** 2) / 0.02);
      const bh = v * h * 0.55 * grow, y = h - bh;
      const g = ix.createLinearGradient(0, h, 0, y); g.addColorStop(0, "#f43f5e"); g.addColorStop(1, "#fbbf24");
      ix.globalAlpha = 0.55; ix.fillStyle = g;
      for (let yy = h; yy > y; yy -= 12 * k) ix.fillRect(i * bw + 2 * k, yy - 9 * k, bw - 4 * k, 9 * k); // LED segments
      ix.globalAlpha = 1;
    }
  },
  wave(t, w, h, k, cx, cy) {        // glowing sound waves sweep across the screen
    const sweep = Math.min(1, t / 1500);
    for (let L = 0; L < 4; L++) {
      ix.beginPath(); ix.lineWidth = (3 - L * 0.5) * k; ix.strokeStyle = `hsla(${hue(L * 18)},95%,${60 + L * 5}%,${0.9 - L * 0.18})`;
      ix.shadowBlur = 18 * k; ix.shadowColor = "#f43f5e";
      for (let x = 0; x <= w * sweep; x += 4 * k) {
        const p = x / w, env = Math.sin(p * Math.PI);
        const y = cy + Math.sin(p * (14 + L * 3) + t / (220 + L * 60)) * h * 0.13 * env * (1 - L * 0.15) + Math.sin(p * 40 + t / 90) * 6 * k * env;
        x ? ix.lineTo(x, y) : ix.moveTo(x, y);
      }
      ix.stroke();
    }
    ix.shadowBlur = 0;
  },
  glitch(t, w, h, k) {              // scanlines, RGB noise blocks
    ix.fillStyle = "rgba(255,255,255,.03)";
    for (let y = (t / 20) % (4 * k); y < h; y += 4 * k) ix.fillRect(0, y, w, k);
    const burst = (Math.floor(t / 90) % 9 === 0) || t < 1400;
    if (burst) for (let i = 0; i < 14; i++) {
      ix.fillStyle = ["#f43f5e55", "#fbbf2455", "#22d3ee44"][i % 3];
      ix.fillRect(R() * w, R() * h, R() * w * 0.4, R() * 6 * k + 2 * k);
    }
  },
  burst(t, w, h, k, cx, cy) {       // particles rush in, then explode outward
    const M = Math.max(w, h) * 0.7, impact = 1100;
    parts.forEach(p => {
      let r;
      if (t < impact) r = M * p.d * (1 - Math.pow(t / impact, 2 * p.s));
      else r = Math.min(M * 1.3, (t - impact) * 0.35 * k * p.s * p.d + 80 * k);
      const x = cx + Math.cos(p.a + t / 4000) * r, y = cy + Math.sin(p.a + t / 4000) * r;
      ix.fillStyle = `hsla(${hue(p.h + 20)},95%,65%,${t < impact ? 0.9 : Math.max(0.15, 1 - (t - impact) / 3000)})`;
      ix.beginPath(); ix.arc(x, y, p.z * k, 0, 7); ix.fill();
    });
    if (t > impact && t < impact + 700) {   // shockwave
      const q = (t - impact) / 700; ix.strokeStyle = `rgba(251,191,36,${1 - q})`; ix.lineWidth = 6 * k * (1 - q);
      ix.beginPath(); ix.arc(cx, cy, q * M * 0.8, 0, 7); ix.stroke();
    }
  }
};
function introLoop(now) {
  if (!introRunning) return;
  if (introT0 == null) introT0 = now;
  const t = now - introT0, k = devicePixelRatio;
  const w = ic.width = innerWidth * k, h = ic.height = innerHeight * k;
  ix.clearRect(0, 0, w, h);
  INTRO_DRAW[introStyle](t, w, h, k, w / 2, h * 0.42);
  requestAnimationFrame(introLoop);
}
requestAnimationFrame(introLoop);

/* ---------- Audio graph ---------- */
const audio = new Audio();
audio.crossOrigin = "anonymous";   // lets the visualizer/equalizer work on songs streamed from the family server
audio.preload = "metadata";
let ctx, analyser, filters = [], bass, pan, master, freq, wave, kNodes = null, karaoke = store.get("karaoke", false);
// Voice detector: energy in the voice band (250–3500 Hz) that sits in the centre of the stereo mix
let midAn = null, sideAn = null, mBuf, sBuf, vAvg = -60, voiceOn = false, voiceLevel = 0;
function detectVoice() {
  if (!midAn || audio.paused) { voiceOn = false; return; }
  midAn.getFloatFrequencyData(mBuf); sideAn.getFloatFrequencyData(sBuf);
  const hz = ctx.sampleRate / midAn.fftSize, a = Math.floor(250 / hz), b = Math.ceil(3500 / hz);
  let m = 0, s = 0;
  for (let i = a; i < b; i++) { if (isFinite(mBuf[i])) m += 10 ** (mBuf[i] / 10); if (isFinite(sBuf[i])) s += 10 ** (sBuf[i] / 10); }
  const centre = Math.max(0, m - s / 1.44), lvl = 10 * Math.log10(centre + 1e-12);
  if (lvl < -110) { voiceOn = false; return; }
  vAvg = vAvg * 0.994 + lvl * 0.006;
  voiceLevel = lvl - vAvg; voiceOn = voiceLevel > -1.5;
}
// Karaoke mode: cancel the centre-panned voice (left minus right) and add the low end back so the bass stays
function setKaraoke(on) {
  karaoke = on; store.set("karaoke", on);
  if (kNodes) { const t = ctx.currentTime; kNodes.dry.gain.setTargetAtTime(on ? 0 : 1, t, 0.05); kNodes.wet.gain.setTargetAtTime(on ? 1 : 0, t, 0.05); }
  const b = document.getElementById("karaokeBtn"), c = document.getElementById("karaokeOn");
  if (b) b.classList.toggle("active", on); if (c) c.checked = on;
}
const BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const PRESETS = {
  "Flat": [0,0,0,0,0,0,0,0,0,0],
  "Bass Boost": [7,6,5,3,1,0,0,0,0,0],
  "Treble Boost": [0,0,0,0,0,1,3,5,6,7],
  "Rock": [5,4,3,1,-1,-1,1,3,4,5],
  "Pop": [-1,1,3,4,3,0,-1,-1,1,2],
  "Jazz": [3,2,1,2,-1,-1,0,1,2,3],
  "Classical": [4,3,2,1,-1,-1,0,2,3,4],
  "Electronic": [5,4,1,0,-2,2,1,1,4,5],
  "Hip-Hop": [6,5,2,3,-1,-1,1,0,2,3],
  "Vocal": [-2,-3,-2,1,4,4,3,1,0,-2],
  "Acoustic": [4,3,2,1,2,2,3,3,2,1],
  "Late Night": [3,2,1,0,-1,0,1,1,0,-1]
};
let eqGains = store.get("eq", PRESETS.Flat.slice());

function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaElementSource(audio);
  filters = BANDS.map((f, i) => {
    const b = ctx.createBiquadFilter();
    b.type = i === 0 ? "lowshelf" : i === BANDS.length - 1 ? "highshelf" : "peaking";
    b.frequency.value = f; b.Q.value = 1.1; b.gain.value = 0;
    return b;
  });
  bass = ctx.createBiquadFilter(); bass.type = "lowshelf"; bass.frequency.value = 90;
  pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
  master = ctx.createGain();
  analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.8;
  const dry = ctx.createGain(), wet = ctx.createGain(), split = ctx.createChannelSplitter(2), inv = ctx.createGain(),
    diff = ctx.createGain(), merge = ctx.createChannelMerger(2), lowKeep = ctx.createBiquadFilter(), mix = ctx.createGain();
  inv.gain.value = -1; diff.gain.value = 1.2; lowKeep.type = "lowpass"; lowKeep.frequency.value = 150;
  src.connect(dry); src.connect(split); split.connect(diff, 0); split.connect(inv, 1); inv.connect(diff);
  diff.connect(merge, 0, 0); diff.connect(merge, 0, 1); merge.connect(wet); src.connect(lowKeep); lowKeep.connect(wet);
  const midSum = ctx.createGain(); split.connect(midSum, 0); split.connect(midSum, 1);
  midAn = ctx.createAnalyser(); sideAn = ctx.createAnalyser(); midAn.fftSize = sideAn.fftSize = 1024; midAn.smoothingTimeConstant = sideAn.smoothingTimeConstant = 0.5;
  mBuf = new Float32Array(midAn.frequencyBinCount); sBuf = new Float32Array(sideAn.frequencyBinCount);
  midSum.connect(midAn); diff.connect(sideAn);
  dry.connect(mix); wet.connect(mix); kNodes = { dry, wet }; dry.gain.value = karaoke ? 0 : 1; wet.gain.value = karaoke ? 1 : 0;
  let n = mix; [...filters, bass, pan, master].forEach(f => { n.connect(f); n = f; });
  n.connect(analyser); analyser.connect(ctx.destination);
  freq = new Uint8Array(analyser.frequencyBinCount); wave = new Uint8Array(analyser.fftSize);
  applyEq(); bass.gain.value = +$("#bassBoost").value; setBalance();
}

/* ---------- Family media server (Pulsewave Server on the NAS) ---------- */
const Srv = (() => {
  let cfg = store.get("server", null);       // { url, token, user, use, name, same }
  let saveT = 0, info = null, adminUsers = [];
  const on = () => !!(cfg && cfg.token && cfg.use !== false && libFromServer);
  let libFromServer = false;
  const clean = u => String(u || "").trim().replace(/\/+$/, "").replace(/\/index\.html$/, "");
  async function call(q, opts = {}, c = cfg) {
    const headers = { ...(opts.headers || {}) };
    if (c && c.token) headers.Authorization = "Bearer " + c.token;
    let body = opts.body; if (opts.json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(opts.json); }
    const r = await fetch(clean(c.url) + "/api/" + q, { method: opts.method || "GET", headers, body });
    const data = (r.headers.get("content-type") || "").includes("json") ? await r.json() : await r.text();
    if (r.status === 401 && c === cfg && cfg.token && !/^(login|setup)/.test(q)) { cfg.token = null; store.set("server", cfg); toast("Please sign in to the family server again"); open(); }
    if (!r.ok) throw new Error((data && data.error) || r.statusText || "Request failed");
    return data;
  }
  const tok = () => encodeURIComponent(cfg.token);
  const stream = s => `${clean(cfg.url)}/api/stream/${s.id}?t=${tok()}`;
  const art = s => `${clean(cfg.url)}/api/art/${s.id}?t=${tok()}`;

  async function loadLibrary() {
    const [lib, ud] = await Promise.all([call("library"), call("userdata")]);
    const favs = new Set(ud.favs || []), plays = ud.plays || {};
    songs = lib.songs.map(r => ({ id: r.id, remote: true, title: r.title, artist: r.artist, album: r.album, duration: r.duration, year: r.year, genre: r.genre,
      fname: r.fname, size: r.size, added: r.added, art: r.hasArt ? "remote" : null, hasLrc: r.hasLrc, fav: favs.has(r.id), plays: plays[r.id] || 0 }));
    folders = ud.folders || [];
    playlists = [...(ud.playlists || []).filter(p => !p.ro),
      ...(ud.family || []).map(p => ({ ...p, id: "fam:" + p.owner + ":" + p.id, ro: true, shared: false, folderId: undefined }))];
    tracks = tracks.map(t => songs.find(s => s.id === t.id) || t);
    libFromServer = true;
    return lib;
  }
  async function reload() { await loadLibrary(); render(); }
  function saveUser() {
    if (!on()) return;
    clearTimeout(saveT);
    saveT = setTimeout(async () => {
      try {
        await call("userdata", { method: "PUT", json: { favs: songs.filter(s => s.fav).map(s => s.id),
          plays: Object.fromEntries(songs.filter(s => s.plays).map(s => [s.id, s.plays])), playlists: playlists.filter(p => !p.ro), folders } });
      } catch (e) { toast("Couldn't save to the family server: " + e.message); }
    }, 700);
  }
  async function putLyrics(s) { try { await call("lyrics/" + s.id, { method: "PUT", body: s.lrc || "" }); s.hasLrc = !!s.lrc; } catch (e) { toast("Couldn't save lyrics to the server: " + e.message); } }
  async function lyrics(s) { return call("lyrics/" + s.id); }
  async function upload(files, folder) {
    if (!cfg.user || (!cfg.user.upload && !cfg.user.admin)) { toast("Ask the admin for permission to add music to the family library"); return []; }
    files = [...files];
    const base = n => n.replace(/\.[^.]+$/, "").toLowerCase();
    const lrcs = files.filter(f => /\.lrc$/i.test(f.name));
    const list = files.filter(f => /\.(mp3|m4a|aac|flac|ogg|oga|opus|wav|webm|aiff?|alac)$/i.test(f.name));
    const ids = [];
    for (const [i, f] of list.entries()) {
      toast(`Uploading ${i + 1} of ${list.length}: ${f.name}`);
      try {
        const r = await call(`upload?name=${encodeURIComponent(f.name)}&folder=${encodeURIComponent(folder || "")}`, { method: "PUT", body: f });
        ids.push(r.id);
        const l = lrcs.find(x => base(x.name) === base(f.name));
        if (l) await call("lyrics/" + r.id, { method: "PUT", body: await l.text() }).catch(() => {});
      } catch (e) { toast(`${f.name}: ${e.message}`); }
    }
    if (!ids.length) return [];
    toast("Updating the family library…");
    await call("rescan?wait=1", { method: "POST" });
    await reload();
    toast(`Added ${plural(ids.length, "song")} to the family library`);
    return ids.map(id => songs.find(s => s.id === id)).filter(Boolean);
  }
  async function removeSong(s) {
    if (!cfg.user || !cfg.user.admin) { toast("Only the admin can remove songs from the family library"); return false; }
    if (!await ask("Remove from the family library?", null, "Delete", `“${s.title}” will be hidden for everyone. The file itself stays on the NAS.`)) return false;
    await call("songs/" + s.id, { method: "DELETE" }); return true;
  }

  /* --- startup --- */
  async function boot() {
    if (location.protocol.startsWith("http")) {            // opened from the server itself? use it automatically
      try {
        const r = await fetch("api/info", { cache: "no-store" });
        if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
          info = await r.json();
          if (info.pulsewaveServer) {
            const here = clean(location.origin + location.pathname.replace(/[^/]*$/, ""));
            if (!cfg || clean(cfg.url) !== here) { cfg = { url: here, token: null, use: true, same: true }; store.set("server", cfg); }
            cfg.name = info.name; cfg.same = true;
          }
        }
      } catch {}
    }
    badge();
    if (!cfg || cfg.use === false) return false;
    if (!cfg.token) { if (cfg.same) setTimeout(open, 50); return false; }
    try { await loadLibrary(); badge(); return true; }
    catch (e) { if (cfg.token) toast("The family server can't be reached right now, so you're seeing this device's library."); return false; }
  }
  function badge() { const b = $("#srvBtn"); b.classList.toggle("linked", !!(cfg && cfg.token && cfg.use !== false)); b.title = cfg && cfg.name ? cfg.name : "Family server"; }

  /* --- the Family server window --- */
  const B = () => $("#srvBody");
  async function open() {
    $("#srvModal").classList.remove("hidden");
    if (!cfg || !cfg.url) return viewAddress();
    try { info = await call("info", {}, { url: cfg.url }); cfg.name = info.name; store.set("server", cfg); }
    catch { return viewAddress("Can't reach the server at " + cfg.url + ". Check the address and that the NAS is on."); }
    if (info.setup) return viewSetup();
    if (!cfg.token) return viewLogin();
    return viewAccount();
  }
  const close = () => $("#srvModal").classList.add("hidden");
  function msg(t, bad) { const m = $("#srvMsg"); if (m) { m.textContent = t || ""; m.classList.toggle("bad", !!bad); } }
  function viewAddress(problem) {
    const mixed = location.protocol === "https:";
    B().innerHTML = `<p>Enter the address of your family's Pulsewave Server, for example <code>http://192.168.1.20:8095</code> at home, or the Tailscale name like <code>http://nas:8095</code>.</p>
      <div class="srv-row"><input id="srvUrl" type="url" placeholder="http://192.168.1.20:8095" value="${esc(cfg && cfg.url || "")}"><button class="btn primary" id="srvGo">Connect</button></div>
      ${mixed ? `<p class="muted small">Tip: on this website, browsers block plain <b>http://</b> servers. Open the server's address directly in your browser instead. It has Pulsewave built in.</p>` : ""}
      <p id="srvMsg" class="srv-msg${problem ? " bad" : ""}">${esc(problem || "")}</p>`;
    $("#srvGo").onclick = async () => {
      let u = clean($("#srvUrl").value); if (!u) return;
      if (!/^https?:\/\//.test(u)) u = "http://" + u;
      if (mixed && u.startsWith("http:")) { msg("Opening the server directly…"); location.href = u + "/"; return; }
      msg("Connecting…");
      try { const i = await call("info", {}, { url: u }); if (!i.pulsewaveServer) throw 0; cfg = { url: u, token: null, use: true, name: i.name }; store.set("server", cfg); open(); }
      catch { msg("No Pulsewave Server found at that address.", true); }
    };
    $("#srvUrl").onkeydown = e => { if (e.key === "Enter") $("#srvGo").click(); };
  }
  function viewSetup() {
    B().innerHTML = `<p><b>Welcome to ${esc(info.name)}!</b> First, create the <b>admin</b> account. That's you. You'll add your family next.</p>
      <div class="srv-form"><input id="srvName" placeholder="Your name" autocomplete="username"><input id="srvPass" type="password" placeholder="Password (6+ characters)" autocomplete="new-password">
      <button class="btn primary" id="srvDo">Create admin account</button></div><p id="srvMsg" class="srv-msg"></p>`;
    $("#srvDo").onclick = async () => {
      try { const r = await call("setup", { method: "POST", json: { name: $("#srvName").value, password: $("#srvPass").value } }, { url: cfg.url }); signedIn(r); }
      catch (e) { msg(e.message, true); }
    };
  }
  function viewLogin() {
    B().innerHTML = `<p>Sign in to <b>${esc(cfg.name || "the family server")}</b>.</p>
      <div class="srv-form"><input id="srvName" placeholder="Name" autocomplete="username" autocapitalize="none"><input id="srvPass" type="password" placeholder="Password" autocomplete="current-password">
      <button class="btn primary" id="srvDo">Sign in</button></div><p id="srvMsg" class="srv-msg"></p>
      ${cfg.same ? "" : `<p class="muted small"><a href="#" id="srvOther">Use a different server</a></p>`}`;
    const go = async () => { try { const r = await call("login", { method: "POST", json: { name: $("#srvName").value, password: $("#srvPass").value } }, { url: cfg.url }); signedIn(r); } catch (e) { msg(e.message, true); } };
    $("#srvDo").onclick = go; $("#srvPass").onkeydown = e => { if (e.key === "Enter") go(); };
    const o = $("#srvOther"); if (o) o.onclick = e => { e.preventDefault(); viewAddress(); };
    setTimeout(() => $("#srvName").focus(), 30);
  }
  async function signedIn(r) {
    cfg.token = r.token; cfg.user = r.user; cfg.use = true; store.set("server", cfg);
    try { await loadLibrary(); } catch {}
    badge(); go({ type: "playlists" }); toast(`Welcome, ${r.user.name}!`);
    viewAccount();
  }
  async function viewAccount() {
    try { const me = await call("me"); cfg.user = me.user; store.set("server", cfg); } catch { return; }
    const u = cfg.user;
    B().innerHTML = `<div class="srv-me"><span class="avatar" style="background:hsl(${hueOf(u.name)},60%,40%)">${esc(u.name[0].toUpperCase())}</span>
        <span><b>${esc(u.name)}</b><small>${u.admin ? "Admin" : u.upload ? "Family · can add music" : "Family"} · ${esc(cfg.name || "")}</small></span></div>
      <label class="switch srv-use"><input type="checkbox" id="srvUse"${cfg.use !== false ? " checked" : ""}> Show the <b>family library</b> on this device <small class="muted">(off = this device's own library)</small></label>
      <div class="srv-actions"><button class="btn" id="srvPw">Change password</button><button class="btn" id="srvOut">Sign out</button>${cfg.same ? "" : `<button class="btn" id="srvForget">Forget server</button>`}</div>
      <p id="srvMsg" class="srv-msg"></p>
      ${u.admin ? `<h3>Family members</h3><ul class="srv-users" id="srvUsers"><li class="muted">Loading…</li></ul>
        <div class="srv-add"><b>Add a person</b><div class="srv-form row"><input id="nuName" placeholder="Name" autocomplete="off"><input id="nuPass" type="text" placeholder="Password (6+)" autocomplete="off"></div>
        <label class="switch"><input type="checkbox" id="nuUp"> Can add music</label> <label class="switch"><input type="checkbox" id="nuAdmin"> Admin</label>
        <button class="btn primary" id="nuGo">Add</button></div>
        <h3>Music library</h3><p class="muted" id="srvLib">…</p>
        <div class="srv-actions"><button class="btn" id="srvScan">Rescan music folder</button><button class="btn" id="srvUnhide">Restore removed songs</button></div>` : ""}`;
    $("#srvUse").onchange = async e => { cfg.use = e.target.checked; store.set("server", cfg); location.reload(); };
    $("#srvOut").onclick = async () => { try { await call("logout", { method: "POST" }); } catch {} cfg.token = null; cfg.user = null; store.set("server", cfg); location.reload(); };
    const f = $("#srvForget"); if (f) f.onclick = () => { store.set("server", null); location.reload(); };
    $("#srvPw").onclick = async () => {
      const old = await ask("Current password", "", "Next"); if (!old) return;
      const nw = await ask("New password (6+ characters)", "", "Save"); if (!nw) return;
      try { await call("password", { method: "POST", json: { old, password: nw } }); msg("Password changed ✓"); } catch (e) { msg(e.message, true); }
    };
    if (!u.admin) return;
    const loadUsers = async () => {
      const r = await call("users"); adminUsers = r.users;
      $("#srvUsers").innerHTML = adminUsers.map(x => `<li data-u="${esc(x.name)}"><span class="avatar" style="background:hsl(${hueOf(x.name)},60%,40%)">${esc(x.name[0].toUpperCase())}</span>
        <span class="un"><b>${esc(x.name)}</b><small>${x.admin ? "Admin" : "Family"} · ${x.lastSeen ? "last here " + new Date(x.lastSeen).toLocaleDateString() : "hasn't signed in yet"}</small></span>
        <label class="switch" title="Can add music"><input type="checkbox" data-up${x.upload ? " checked" : ""}${x.admin ? " disabled" : ""}> 🎵＋</label>
        ${x.name === u.name ? "" : `<button class="btn" data-pw>Reset password</button><button class="btn" data-del title="Remove">✕</button>`}</li>`).join("");
    };
    $("#srvUsers").onclick = async e => {
      const li = e.target.closest("li[data-u]"); if (!li) return; const name = li.dataset.u;
      try {
        if (e.target.closest("[data-pw]")) { const pw = await ask(`New password for ${name}`, "", "Save"); if (pw) { await call("users/" + encodeURIComponent(name), { method: "PATCH", json: { password: pw } }); msg(`Password for ${name} changed. Tell them the new one.`); } }
        if (e.target.closest("[data-del]")) { if (await ask(`Remove ${name}?`, null, "Delete", `${name} won't be able to sign in any more.`)) { await call("users/" + encodeURIComponent(name), { method: "DELETE" }); loadUsers(); } }
      } catch (er) { msg(er.message, true); }
    };
    $("#srvUsers").onchange = async e => { const li = e.target.closest("li[data-u]"); if (li && e.target.matches("[data-up]")) { try { await call("users/" + encodeURIComponent(li.dataset.u), { method: "PATCH", json: { upload: e.target.checked } }); } catch (er) { msg(er.message, true); } } };
    $("#nuGo").onclick = async () => {
      try { await call("users", { method: "POST", json: { name: $("#nuName").value, password: $("#nuPass").value, upload: $("#nuUp").checked, admin: $("#nuAdmin").checked } });
        msg(`Added ${$("#nuName").value.trim()}. Send them the server address, their name and password.`); $("#nuName").value = $("#nuPass").value = ""; loadUsers(); }
      catch (er) { msg(er.message, true); }
    };
    const libInfo = async () => { try { const l = await call("library"); $("#srvLib").textContent = `${plural(l.songs.length, "song")} · last scanned ${l.scannedAt ? new Date(l.scannedAt).toLocaleString() : "never"}${l.scanning ? ` · scanning ${l.progress.done}/${l.progress.total}…` : ""}`; } catch {} };
    $("#srvScan").onclick = async () => { msg("Scanning the music folder… this can take a while the first time."); try { await call("rescan?wait=1", { method: "POST" }); await reload(); libInfo(); msg("Library updated ✓"); } catch (er) { msg(er.message, true); } };
    $("#srvUnhide").onclick = async () => { try { await call("hidden", { method: "DELETE" }); await reload(); libInfo(); msg("Removed songs are back ✓"); } catch (er) { msg(er.message, true); } };
    loadUsers().catch(er => msg(er.message, true)); libInfo();
  }
  $("#srvBtn").onclick = open;
  $("#srvClose").onclick = close;
  $("#srvModal").onclick = e => { if (e.target.id === "srvModal") close(); };

  return { boot, on, stream, art, saveUser, putLyrics, lyrics, upload, removeSong, reload, open, user: () => cfg && cfg.user, name: () => cfg && cfg.name };
})();

/* ---------- Library, playlists & queue (saved on this device) ---------- */
let tracks = [], cur = -1, shuffle = store.get("shuffle", false), repeat = store.get("repeat", "off"); // tracks = the play queue ("Up Next")
let songs = [], playlists = [], folders = [], view = { type: store.get("libView", "playlists") }, query = "", rowCtx = null, libReady = false;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clean = n => n.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtLen = s => isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "";
const mins = s => s >= 3600 ? `${Math.floor(s / 3600)} hr ${Math.round(s % 3600 / 60)} min` : `${Math.max(1, Math.round(s / 60))} min`;
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

const DB = (() => {
  let p = null;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open("pulsewave", 1);
    r.onupgradeneeded = () => { r.result.createObjectStore("songs", { keyPath: "id" }); r.result.createObjectStore("playlists", { keyPath: "id" }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const run = (name, mode, fn) => open().then(d => new Promise((res, rej) => {
    const t = d.transaction(name, mode), req = fn(t.objectStore(name));
    t.oncomplete = () => res(req && req.result); t.onerror = t.onabort = () => rej(t.error);
  }));
  return {
    all: n => run(n, "readonly", s => s.getAll()).catch(() => []),
    put: (n, v) => run(n, "readwrite", s => s.put(v)).catch(e => toast("Couldn't save to this device (" + ((e && e.name) || "storage error") + ")")),
    del: (n, k) => run(n, "readwrite", s => s.delete(k)).catch(() => {})
  };
})();
// keep = true when applying a change that came from another device (don't re-stamp it)
const syncChanged = () => { if (window.__pwSync) window.__pwSync.changed(); };
const saveSong = (s, keep) => {
  if (s.remote) { if (s.lrc != null && s.lrc !== s._lrcSent) { s._lrcSent = s.lrc; Srv.putLyrics(s); } Srv.saveUser(); return Promise.resolve(); }
  const { url, artUrl, ...rec } = s; if (!keep) syncChanged(); return DB.put("songs", rec);
};
const savePl = (p, keep) => { if (!keep) { p.updated = Date.now(); syncChanged(); } if (Srv.on()) { Srv.saveUser(); return Promise.resolve(); } return DB.put("playlists", p); };
const tomb = k => { const t = store.get("tomb", {}); t[k] = Date.now(); store.set("tomb", t); syncChanged(); };
function removeSongLocal(s) {
  songs = songs.filter(x => x !== s);
  playlists.forEach(p => { const n = p.songIds.length; p.songIds = p.songIds.filter(id => id !== s.id); if (p.songIds.length !== n) savePl(p, true); });
  for (let i = tracks.length - 1; i >= 0; i--) if (tracks[i] === s) removeFromQueue(i);
  if (s.url) URL.revokeObjectURL(s.url); if (s.artUrl) URL.revokeObjectURL(s.artUrl);
  DB.del("songs", s.id);
}
function removePlLocal(p) {
  playlists = playlists.filter(x => x !== p); folders = folders.filter(x => x !== p);
  if (Srv.on()) Srv.saveUser(); else DB.del("playlists", p.id);
  if (view.id === p.id) view = { type: "playlists" };
}
const srcUrl = s => s.remote ? Srv.stream(s) : s.url || (s.url = URL.createObjectURL(s.file));
const artUrl = s => s && s.art ? (s.remote ? Srv.art(s) : s.artUrl || (s.artUrl = URL.createObjectURL(s.art))) : "logo.svg";
const editable = p => !p.smart && !p.ro;

// Title, artist, album and cover art from an MP3's ID3v2 tag
async function readTags(file) {
  const out = {};
  try {
    if (!/\.mp3$/i.test(file.name)) return out;
    const h = new Uint8Array(await file.slice(0, 10).arrayBuffer());
    if (h[0] !== 73 || h[1] !== 68 || h[2] !== 51) return out;
    const ver = h[3], ss = (b, i) => (b[i] << 21) | (b[i + 1] << 14) | (b[i + 2] << 7) | b[i + 3];
    const b = new Uint8Array(await file.slice(10, 10 + ss(h, 6)).arrayBuffer());
    const dec = (enc, x) => {
      try {
        if (enc === 0) return new TextDecoder("latin1").decode(x);
        if (enc === 3) return new TextDecoder("utf-8").decode(x);
        if (enc === 2) return new TextDecoder("utf-16be").decode(x);
        return new TextDecoder(x[0] === 0xfe ? "utf-16be" : "utf-16le").decode(x.subarray(2));
      } catch { return ""; }
    };
    const term = (f, q, enc) => {
      if (enc === 1 || enc === 2) { while (q + 1 < f.length && !(f[q] === 0 && f[q + 1] === 0)) q += 2; return q + 2; }
      while (q < f.length && f[q] !== 0) q++; return q + 1;
    };
    for (let p = 0; p + 10 < b.length;) {
      const id = String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]); if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const fs = ver >= 4 ? ss(b, p + 4) : (b[p + 4] << 24 | b[p + 5] << 16 | b[p + 6] << 8 | b[p + 7]) >>> 0;
      const f = b.subarray(p + 10, p + 10 + fs);
      if (id === "TIT2" || id === "TPE1" || id === "TALB" || id === "TYER" || id === "TDRC" || id === "TCON") out[id] = dec(f[0], f.subarray(1)).replace(/\0/g, "").trim();
      if (id === "APIC" && !out.art) {
        const enc = f[0]; let q = 1; while (q < f.length && f[q] !== 0) q++;
        let mime = new TextDecoder("latin1").decode(f.subarray(1, q)) || "image/jpeg";
        if (!mime.includes("/")) mime = "image/" + mime.toLowerCase();
        q = term(f, q + 2, enc);
        out.art = new Blob([f.slice(q)], { type: mime });
      }
      p += 10 + fs;
    }
  } catch {}
  return out;
}
const getDuration = f => new Promise(res => {
  const a = new Audio(), u = URL.createObjectURL(f); let done = false;
  const fin = d => { if (done) return; done = true; URL.revokeObjectURL(u); res(isFinite(d) ? d : 0); };
  a.preload = "metadata"; a.onloadedmetadata = () => fin(a.duration); a.onerror = () => fin(0); setTimeout(() => fin(0), 6000); a.src = u;
});

async function addFiles(files, quiet, folder) {
  if (Srv.on()) { const up = await Srv.upload(files, folder); if (up.length && !quiet && cur === -1) playList(up, 0); return up; }
  files = [...files];
  const base = n => n.replace(/\.[^.]+$/, "").toLowerCase();
  const lrcs = files.filter(f => /\.(lrc|txt)$/i.test(f.name));
  const list = files.filter(f => f.type.startsWith("audio/") || /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i.test(f.name));
  const added = [];
  if (list.length) toast(`Adding ${plural(list.length, "song")}…`);
  for (const f of list) {
    let s = songs.find(x => x.fname === f.name && x.size === f.size);
    if (!s) {
      const tags = await readTags(f), name = clean(f.name), m = name.split(" - ");
      s = {
        id: uid(), fname: f.name, size: f.size, file: f, added: Date.now(), fav: false,
        title: tags.TIT2 || (m.length > 1 ? m.slice(1).join(" - ").trim() : name),
        artist: tags.TPE1 || (m.length > 1 ? m[0].trim() : "Unknown artist"),
        album: tags.TALB || "", art: tags.art || null, duration: await getDuration(f),
        year: (tags.TDRC || tags.TYER || "").slice(0, 4), genre: (tags.TCON || "").replace(/^\(\d+\)/, "")
      };
      songs.push(s);
    }
    const l = lrcs.find(l => base(l.name) === base(f.name)); if (l) s.lrc = await l.text();
    await saveSong(s); added.push(s);
  }
  // .lrc files added on their own attach to the song with the same name, or to the song playing now
  for (const l of lrcs) if (!list.some(f => base(f.name) === base(l.name))) {
    const s = songs.find(x => base(x.fname) === base(l.name)) || tracks[cur];
    if (s) { s.lrc = await l.text(); await saveSong(s); if (s === tracks[cur]) Lyrics.load(s); toast(`Lyrics added to “${s.title}”`); }
  }
  if (added.length && !quiet) {
    toast(`Added ${plural(added.length, "song")} to your library`);
    if (cur === -1) playList(added, 0); else render();
  }
  return added;
}
// Import a folder from the computer: every song in it goes into a playlist named after the folder
async function importFolder(files) {
  files = [...files]; if (!files.length) return;
  const dirOf = f => { const parts = (f.webkitRelativePath || "").split("/"); return parts.length > 1 ? parts[parts.length - 2] : "Imported"; };
  const groups = new Map();
  files.forEach(f => { const d = dirOf(f); if (!groups.has(d)) groups.set(d, []); groups.get(d).push(f); });
  let made = 0;
  for (const [name, fs] of groups) {
    const added = await addFiles(fs, true, name);
    if (!added.length) continue;
    const p = { id: uid(), name, songIds: added.map(s => s.id), created: Date.now(), folderId: view.type === "folder" ? view.id : undefined };
    playlists.push(p); await savePl(p); made++;
  }
  toast(made ? `Imported ${plural(made, "playlist")}` : "No songs found in that folder");
  render();
}

/* --- playback queue --- */
function playList(list, i = 0, shuf = false) {
  if (!list.length) return;
  tracks = list.slice();
  if (shuf) { shuffle = true; syncModes(); i = Math.floor(Math.random() * tracks.length); }
  load(i, true);
}
function load(i, play) {
  if (!tracks[i]) return;
  cur = i; audio.src = srcUrl(tracks[i]); setMeta(); render();
  tracks[i].plays = (tracks[i].plays || 0) + 1; tracks[i].lastPlayed = Date.now(); saveSong(tracks[i]);
  Lyrics.load(tracks[i]);
  if (play) playNow();
}
function stopAll() { audio.pause(); audio.removeAttribute("src"); cur = -1; tracks = []; setMeta(); Lyrics.load(null); render(); }
function removeFromQueue(i) {
  tracks.splice(i, 1);
  if (i === cur) { if (tracks.length) load(Math.min(i, tracks.length - 1), !audio.paused); else stopAll(); }
  else if (i < cur) cur--;
  render();
}
function setMeta() {
  const t = tracks[cur];
  $("#trackTitle").textContent = t ? t.title : "No track loaded";
  $("#trackArtist").textContent = t ? t.artist + (t.album ? " · " + t.album : "") : "Add songs to begin";
  $("#art img").src = t ? artUrl(t) : "logo.svg";
  document.title = t ? `${t.title} · ${C.name}` : C.name;
  if (t && "mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album || C.name,
      artwork: [t.art ? { src: artUrl(t) } : { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }] });
  }
}
function playNow() { initAudio(); ctx.resume(); audio.play().catch(() => {}); }
function toggle() {
  if (cur === -1) { if (tracks.length) load(0, true); else if (songs.length) playList(songs); else $("#fileInput").click(); return; }
  audio.paused ? playNow() : audio.pause();
}
function next(auto) {
  if (!tracks.length) return;
  if (auto && repeat === "one") { audio.currentTime = 0; return playNow(); }
  let n;
  if (shuffle && tracks.length > 1) { do n = Math.floor(Math.random() * tracks.length); while (n === cur); }
  else n = cur + 1;
  if (n >= tracks.length) { if (auto && repeat === "off") { audio.pause(); audio.currentTime = 0; return; } n = 0; }
  load(n, true);
}
function prev() { if (audio.currentTime > 3) { audio.currentTime = 0; return; } load(cur <= 0 ? tracks.length - 1 : cur - 1, true); }

/* --- playlists --- */
const SMART = [
  { id: "_fav", name: "Favorite Songs", smart: true, icon: "♥", list: () => songs.filter(s => s.fav) },
  { id: "_recent", name: "Recently Added", smart: true, icon: "🕘", list: () => [...songs].sort((a, b) => b.added - a.added).slice(0, 50) }
];
const getPl = id => SMART.find(p => p.id === id) || playlists.find(p => p.id === id);
const plSongs = p => p.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean);
const listOf = p => p.smart ? p.list() : plSongs(p);
const getFolder = id => folders.find(f => f.id === id);
const inFolder = f => playlists.filter(p => p.folderId === f.id);
const folderSongs = f => [...new Set(inFolder(f).flatMap(plSongs))];
const plLabel = p => { const f = p.folderId && getFolder(p.folderId); return f ? `${f.name} › ${p.name}` : p.name; };
async function newFolder() {
  const name = await ask("New folder", `My Folder ${folders.length + 1}`, "Create", "Folders group your playlists together.");
  if (!name) return null;
  const f = { id: uid(), name, folder: true, created: Date.now() };
  folders.push(f); await savePl(f); toast(`Created folder “${f.name}”`); render();
  return f;
}
async function renameFolder(f) { const n = await ask("Rename folder", f.name, "Save"); if (n) { f.name = n; savePl(f); render(); } }
async function deleteFolder(f) {
  if (!await ask("Delete folder?", null, "Delete", `“${f.name}” will be deleted. Its playlists move back to Playlists.`)) return;
  inFolder(f).forEach(p => { delete p.folderId; savePl(p); });
  removePlLocal(f); tomb(f.id); go({ type: "playlists" });
}
function moveToFolder(p, fid) { if (fid) p.folderId = fid; else delete p.folderId; savePl(p); const f = getFolder(fid); toast(f ? `Moved to “${f.name}”` : "Moved out of folder"); render(); }
function folderMenu(anchor, p) {
  menu(anchor, [
    { label: "＋ New folder…", fn: () => newFolder().then(f => f && moveToFolder(p, f.id)) },
    p.folderId && { label: "No folder", fn: () => moveToFolder(p, null) },
    folders.length && "-",
    ...folders.map(f => ({ label: (p.folderId === f.id ? "✓ " : "📁 ") + f.name, fn: () => moveToFolder(p, f.id) }))
  ]);
}
async function newPlaylist(withSong, folderId) {
  const name = await ask("New playlist", `My Playlist ${playlists.length + 1}`, "Create");
  if (!name) return null;
  const p = { id: uid(), name, songIds: withSong ? [withSong.id] : [], created: Date.now() };
  if (folderId) p.folderId = folderId;
  playlists.push(p); await savePl(p); toast(`Created “${p.name}”`);
  return p;
}
function addToPlaylist(p, s) {
  if (p.songIds.includes(s.id)) return toast(`Already in “${p.name}”`);
  p.songIds.push(s.id); savePl(p); toast(`Added to “${p.name}”`); render();
}
function movePl(p, a, b) { if (a === b) return; const [x] = p.songIds.splice(a, 1); p.songIds.splice(b, 0, x); savePl(p); render(); }
function toggleFav(s) { s.fav = !s.fav; s.mtime = Date.now(); saveSong(s); toast(s.fav ? "Added to Favorite Songs" : "Removed from Favorite Songs"); render(); }
async function renamePl(p) { const n = await ask("Rename playlist", p.name, "Save"); if (n) { p.name = n; savePl(p); render(); } }
async function deletePl(p) {
  if (!await ask("Delete playlist?", null, "Delete", `“${p.name}” will be deleted. The songs stay in your library.`)) return;
  removePlLocal(p); tomb(p.id); go({ type: "playlists" });
}
async function deleteSong(s) {
  if (s.remote) { try { if (await Srv.removeSong(s)) { removeSongLocal(s); render(); } } catch (e) { toast(e.message); } return; }
  if (!await ask("Delete from library?", null, "Delete", `“${s.title}” will be removed from this device and from all playlists.`)) return;
  removeSongLocal(s); tomb(s.size + ":" + s.fname); render();
}

/* --- small UI helpers: toast, dialog, pop-up menu --- */
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), 2200); }
function ask(title, value, okLabel = "OK", text = "") {
  return new Promise(res => {
    const m = $("#askModal"), inp = $("#askInput"), ok = $("#askOk"), no = $("#askCancel");
    $("#askTitle").textContent = title; $("#askText").textContent = text; ok.textContent = okLabel;
    ok.classList.toggle("danger", okLabel === "Delete");
    inp.classList.toggle("hidden", value === null); inp.value = value ?? "";
    m.classList.remove("hidden"); if (value !== null) setTimeout(() => { inp.focus(); inp.select(); }, 30);
    const done = v => { m.classList.add("hidden"); ok.onclick = no.onclick = inp.onkeydown = null; res(v); };
    ok.onclick = () => done(value === null ? true : (inp.value.trim() || null));
    no.onclick = () => done(value === null ? false : null);
    inp.onkeydown = e => { if (e.key === "Enter") ok.click(); if (e.key === "Escape") no.click(); };
  });
}
function closeMenu() { const m = $("#ctxMenu"); if (m) m.remove(); }
function menu(anchor, items) {
  closeMenu();
  const m = document.createElement("div"); m.className = "menu"; m.id = "ctxMenu";
  items.filter(Boolean).forEach(it => {
    if (it === "-") return m.appendChild(document.createElement("hr"));
    const b = document.createElement("button"); b.textContent = it.label; if (it.danger) b.className = "danger";
    b.onclick = e => { e.stopPropagation(); closeMenu(); it.fn(); };
    m.appendChild(b);
  });
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
  m.style.left = Math.max(8, Math.min(innerWidth - mw - 8, r.right - mw)) + "px";
  m.style.top = (r.bottom + mh + 8 > innerHeight ? Math.max(8, r.top - mh - 4) : r.bottom + 4) + "px";
  setTimeout(() => addEventListener("click", closeMenu, { once: true }), 0);
}
function songMenu(btn, s, c) {
  const items = [
    { label: "▶  Play next", fn: () => { if (cur === -1) return playList([s]); tracks.splice(cur + 1, 0, s); toast("Playing next"); render(); } },
    { label: "≡  Add to queue", fn: () => { if (cur === -1) return playList([s]); tracks.push(s); toast("Added to queue"); render(); } },
    { label: "＋ Add to playlist…", fn: () => menu(btn, [{ label: "＋ New playlist…", fn: () => newPlaylist(s).then(render) }, playlists.length && "-",
        ...playlists.filter(editable).map(p => ({ label: (p.songIds.includes(s.id) ? "✓ " : "") + plLabel(p), fn: () => addToPlaylist(p, s) }))]) },
    { label: s.fav ? "♡  Remove from Favorites" : "♥  Favorite", fn: () => toggleFav(s) },
    s.artist !== "Unknown artist" && { label: "👤 Go to artist", fn: () => go({ type: "artist", name: s.artist }) },
    s.album && { label: "💿 Go to album", fn: () => go({ type: "album", key: albumKey(s) }) }
  ];
  if (c.pl && editable(c.pl)) items.push("-",
    c.i > 0 && { label: "↑  Move up", fn: () => movePl(c.pl, c.i, c.i - 1) },
    c.i < c.pl.songIds.length - 1 && { label: "↓  Move down", fn: () => movePl(c.pl, c.i, c.i + 1) },
    { label: "Remove from this playlist", fn: () => { c.pl.songIds.splice(c.i, 1); savePl(c.pl); render(); } });
  if (c.queue) items.push("-", { label: "Remove from Up Next", fn: () => removeFromQueue(c.i) });
  if (!s.remote) items.push("-", { label: "Delete from library", danger: true, fn: () => deleteSong(s) });
  else if (Srv.user() && Srv.user().admin) items.push("-", { label: "Remove from family library", danger: true, fn: () => deleteSong(s) });
  menu(btn, items);
}

/* --- library views --- */
const V = $("#libView"), LP = $("#panel-library");
const albumKey = s => (s.album || "Unknown album") + "\u0000" + s.artist;
const hueOf = str => [...String(str)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
function cover(list, p, big) {
  const arts = [...new Set(list.filter(s => s.art).map(artUrl))];
  const cls = "cover" + (big ? " big" : "");
  if (arts.length >= 4) return `<div class="${cls} mosaic">${arts.slice(0, 4).map(u => `<img src="${u}" alt="">`).join("")}</div>`;
  if (arts.length) return `<div class="${cls}"><img src="${arts[0]}" alt=""></div>`;
  const h = hueOf(p.id || p.name);
  return `<div class="${cls} blank" style="background:linear-gradient(135deg,hsl(${h},70%,45%),hsl(${(h + 50) % 360},80%,30%))">${p.icon || "♪"}</div>`;
}
const card = (p, act, extra = "") => { const l = listOf(p); return `<button class="card" data-act="${act}" data-id="${esc(p.id)}">${cover(l, p)}<div class="cn">${esc(p.name)}</div><div class="cs">${extra || (p.ro ? "👪 " + esc(p.owner) + " · " : p.shared ? "👪 Shared · " : "") + plural(l.length, "song")}</div></button>`; };
const head = (title, list, extra = "") => `<div class="pl-btns-row"><span class="muted">${plural(list.length, "song")}${list.length ? ", " + mins(list.reduce((a, s) => a + (s.duration || 0), 0)) : ""}</span>
  ${list.length ? `<button class="btn primary" data-act="play-all">▶ Play</button><button class="btn" data-act="shuffle-all">🔀 Shuffle</button>` : ""}${extra}</div>`;
function songsHtml(list, c = {}) {
  rowCtx = { list, ...c };
  if (!list.length) return "";
  const now = tracks[cur], drag = c.pl && editable(c.pl);
  return `<ol class="songs">${list.map((s, i) => {
    const playing = c.queue ? i === cur : now === s;
    const picked = c.pick && c.pick.songIds.includes(s.id);
    return `<li class="song${playing ? " current" : ""}${c.queue && i < cur ? " played" : ""}" data-i="${i}"${drag ? ' draggable="true"' : ""}>
      ${drag ? '<span class="grip" title="Drag to reorder">⋮⋮</span>' : ""}
      <span class="thumb"><img src="${artUrl(s)}" alt="">${playing ? '<span class="eqi"><i></i><i></i><i></i></span>' : ""}</span>
      <span class="sm"><span class="st">${esc(s.title)}</span><span class="ss">${esc(s.artist)}${s.album ? " · " + esc(s.album) : ""}</span></span>
      <span class="sd">${fmtLen(s.duration)}</span>
      ${c.pick ? `<button class="pick${picked ? " on" : ""}" data-act="pick">${picked ? "✓" : "＋"}</button>` :
        `<button class="fav${s.fav ? " on" : ""}" data-act="fav" title="Favorite">${s.fav ? "♥" : "♡"}</button><button class="more" data-act="more" title="More">⋯</button>`}
    </li>`;
  }).join("")}</ol>`;
}
let curList = [];
const folderBg = f => { const h = hueOf(f.id); return `background:linear-gradient(135deg,hsl(${h},55%,42%),hsl(${(h + 40) % 360},65%,26%))`; };
const folderCard = f => `<button class="card" data-act="open-folder" data-id="${esc(f.id)}"><div class="cover blank folder-cov" style="${folderBg(f)}">📁</div><div class="cn">${esc(f.name)}</div><div class="cs">Folder · ${plural(inFolder(f).length, "playlist")}</div></button>`;
const newTiles = inside => `<button class="card" data-act="new-pl"><div class="cover blank plus">＋</div><div class="cn">New Playlist</div><div class="cs">&nbsp;</div></button>` +
  (inside ? "" : `<button class="card" data-act="new-folder"><div class="cover blank plus">📁</div><div class="cn">New Folder</div><div class="cs">Group playlists</div></button>`) +
  `<button class="card" data-act="import-folder" title="Make a playlist from a folder of music on this device"><div class="cover blank plus">📂</div><div class="cn">Import Folder</div><div class="cs">Folder → playlist</div></button>`;
function go(v) { view = v; if (["playlists", "songs", "artists", "albums", "queue"].includes(v.type)) store.set("libView", v.type); query = ""; $("#libSearch").value = ""; closeMenu(); render(); LP.scrollTop = 0; }
function render() {
  if (!libReady) return;
  const t = view.type, sc = LP.scrollTop;
  const navOf = { playlist: "playlists", pick: "playlists", folder: "playlists", artist: "artists", album: "albums" };
  $$("#libNav button").forEach(b => b.classList.toggle("active", !query && b.dataset.view === (navOf[t] || t)));
  $("#emptyHint").classList.toggle("hidden", songs.length > 0 || tracks.length > 0);
  rowCtx = null; curList = [];
  let h = "";
  const back = (to, label) => `<button class="back" data-act="go" data-to="${to}">‹ ${label}</button>`;
  const q = query.toLowerCase(), match = s => !q || (s.title + " " + s.artist + " " + s.album).toLowerCase().includes(q);

  if (!songs.length && t !== "queue" && !query) {
    h = `<div class="lib-empty"><div class="big-ico">🎵</div><h3>Your library is empty</h3><p class="muted">Add songs from your device. They stay saved here for next time.</p><button class="btn primary" data-act="add-music">＋ Add music</button></div>`;
  } else if (query && t !== "pick") {
    const pls = [...SMART, ...playlists].filter(p => p.name.toLowerCase().includes(q));
    curList = songs.filter(match);
    const fls = folders.filter(f => f.name.toLowerCase().includes(q));
    h = (pls.length || fls.length ? `<h4 class="sec">Playlists</h4><div class="grid">${fls.map(folderCard).join("")}${pls.map(p => card(p, "open-pl")).join("")}</div>` : "") +
      `<h4 class="sec">Songs</h4>` + (curList.length ? songsHtml(curList) : `<p class="muted pad">No songs match “${esc(query)}”.</p>`);
  } else if (t === "playlists") {
    const loose = playlists.filter(p => !p.folderId || !getFolder(p.folderId));
    h = `<div class="grid">${newTiles()}
      ${SMART.map(p => card(p, "open-pl")).join("")}
      ${folders.map(folderCard).join("")}
      ${loose.map(p => card(p, "open-pl")).join("")}</div>`;
  } else if (t === "folder") {
    const f = getFolder(view.id); if (!f) { view = { type: "playlists" }; return render(); }
    const pls = inFolder(f); curList = folderSongs(f);
    h = back("playlists", "Playlists") + `<div class="pl-head"><div class="cover big blank folder-cov" style="${folderBg(f)}">📁</div><div class="pl-info"><h2>${esc(f.name)}</h2>
      <p class="muted">${plural(pls.length, "playlist")}</p><div class="pl-tools"><button class="btn icon" data-act="folder-more" title="More">⋯</button></div></div></div>` +
      head(f.name, curList) + `<div class="grid">${newTiles(true)}${pls.map(p => card(p, "open-pl")).join("")}</div>` +
      (pls.length ? "" : `<p class="muted pad">This folder is empty. Make a playlist here, or open any playlist and use <b>⋯ → Move to folder</b>.</p>`);
  } else if (t === "playlist") {
    const p = getPl(view.id); if (!p) { view = { type: "playlists" }; return render(); }
    curList = listOf(p);
    const pf = p.folderId && getFolder(p.folderId);
    h = (pf ? `<button class="back" data-act="open-folder" data-id="${esc(pf.id)}">‹ ${esc(pf.name)}</button>` : back("playlists", "Playlists")) + `<div class="pl-head">${cover(curList, p, true)}<div class="pl-info"><h2>${esc(p.name)}</h2>
      ${p.ro ? `<p class="muted">👪 Shared by ${esc(p.owner)}</p><div class="pl-tools"><button class="btn" data-act="pl-copy">Copy to my playlists</button></div>` : p.smart ? "" : `<div class="pl-tools"><button class="btn" data-act="add-songs">＋ Add songs</button><button class="btn icon" data-act="pl-more" title="More">⋯</button></div>`}</div></div>` +
      head(p.name, curList) + (curList.length ? songsHtml(curList, { pl: p }) :
      `<p class="muted pad">${p.smart ? (p.id === "_fav" ? "Tap ♡ on any song to add it here." : "Songs you add will show up here.") : "This playlist is empty. Tap <b>＋ Add songs</b> to choose music."}</p>`);
  } else if (t === "pick") {
    const p = getPl(view.id); if (!p) { view = { type: "playlists" }; return render(); }
    curList = songs.filter(match).sort((a, b) => a.title.localeCompare(b.title));
    h = `<div class="pick-head"><span>Add to <b>${esc(p.name)}</b></span><button class="btn primary" data-act="open-pl" data-id="${esc(p.id)}">Done</button></div>` + songsHtml(curList, { pick: p });
  } else if (t === "songs") {
    const sort = store.get("sort", "title");
    curList = [...songs].sort(sort === "recent" ? (a, b) => b.added - a.added : sort === "artist" ? (a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title) : (a, b) => a.title.localeCompare(b.title));
    h = head("Songs", curList, `<select id="libSort" title="Sort"><option value="title">Title</option><option value="artist">Artist</option><option value="recent">Recently added</option></select>`) + songsHtml(curList);
  } else if (t === "artists") {
    const m = new Map(); songs.forEach(s => { if (!m.has(s.artist)) m.set(s.artist, []); m.get(s.artist).push(s); });
    h = `<ul class="links">${[...m].sort((a, b) => a[0].localeCompare(b[0])).map(([n, l]) => { const a = l.find(s => s.art);
      return `<li><button data-act="open-artist" data-name="${esc(n)}"><span class="avatar" style="${a ? "" : `background:hsl(${hueOf(n)},60%,40%)`}">${a ? `<img src="${artUrl(a)}" alt="">` : esc(n[0] || "?")}</span><span class="ln">${esc(n)}</span><span class="muted">${plural(l.length, "song")}</span><span class="chev">›</span></button></li>`; }).join("")}</ul>`;
  } else if (t === "artist") {
    curList = songs.filter(s => s.artist === view.name).sort((a, b) => a.album.localeCompare(b.album) || a.title.localeCompare(b.title));
    h = back("artists", "Artists") + `<h2 class="vh">${esc(view.name)}</h2>` + head(view.name, curList) + songsHtml(curList);
  } else if (t === "albums") {
    const m = new Map(); songs.forEach(s => { const k = albumKey(s); if (!m.has(k)) m.set(k, []); m.get(k).push(s); });
    h = `<div class="grid">${[...m].sort((a, b) => a[0].localeCompare(b[0])).map(([k, l]) =>
      `<button class="card" data-act="open-album" data-key="${esc(k)}">${cover(l, { id: k })}<div class="cn">${esc(l[0].album || "Unknown album")}</div><div class="cs">${esc(l[0].artist)}</div></button>`).join("")}</div>`;
  } else if (t === "album") {
    curList = songs.filter(s => albumKey(s) === view.key).sort((a, b) => a.title.localeCompare(b.title));
    const [al, ar] = view.key.split("\u0000");
    h = back("albums", "Albums") + `<div class="pl-head">${cover(curList, { id: view.key }, true)}<div class="pl-info"><h2>${esc(al)}</h2><p class="muted">${esc(ar)}</p></div></div>` + head(al, curList) + songsHtml(curList);
  } else if (t === "queue") {
    curList = tracks;
    h = `<div class="pl-btns-row"><span class="muted">${tracks.length ? `Playing ${cur + 1} of ${tracks.length}` : "Nothing queued"}</span>${tracks.length > 1 ? '<button class="btn" data-act="clear-queue">Clear upcoming</button>' : ""}</div>` +
      (tracks.length ? songsHtml(tracks, { queue: true }) : `<p class="muted pad">Play a playlist, album or song and it shows up here. Use <b>⋯ → Play next</b> or <b>Add to queue</b> to line up more.</p>`);
  }
  if (Srv.on() && t !== "pick") h = `<div class="src-badge">🏠 <b>${esc(Srv.name() || "Family server")}</b> · ${esc((Srv.user() || {}).name || "")}</div>` + h;
  V.innerHTML = h;
  const so = $("#libSort"); if (so) { so.value = store.get("sort", "title"); so.onchange = () => { store.set("sort", so.value); render(); }; }
  LP.scrollTop = sc;
}

V.addEventListener("click", e => {
  const a = e.target.closest("[data-act]"), row = e.target.closest(".song");
  if (row && rowCtx) {
    const i = +row.dataset.i, s = rowCtx.list[i];
    if (a && a.dataset.act === "fav") return toggleFav(s);
    if (a && a.dataset.act === "more") { e.stopPropagation(); return songMenu(a, s, { ...rowCtx, i }); }
    if (rowCtx.pick) { const p = rowCtx.pick; p.songIds.includes(s.id) ? p.songIds.splice(p.songIds.indexOf(s.id), 1) : p.songIds.push(s.id); savePl(p); return render(); }
    if (rowCtx.queue) return load(i, true);
    return playList(rowCtx.list, i);
  }
  if (!a) return;
  const act = a.dataset.act, p = view.id && getPl(view.id);
  if (act === "go") go({ type: a.dataset.to });
  else if (act === "open-pl") go({ type: "playlist", id: a.dataset.id });
  else if (act === "new-pl") newPlaylist(null, view.type === "folder" ? view.id : undefined).then(np => np && go({ type: "playlist", id: np.id }));
  else if (act === "new-folder") newFolder();
  else if (act === "open-folder") go({ type: "folder", id: a.dataset.id });
  else if (act === "folder-more") { const f = getFolder(view.id); if (f) { e.stopPropagation(); menu(a, [{ label: "＋ New playlist here", fn: () => newPlaylist(null, f.id).then(np => np && go({ type: "playlist", id: np.id })) }, { label: "✎  Rename folder", fn: () => renameFolder(f) }, "-", { label: "Delete folder", danger: true, fn: () => deleteFolder(f) }]); } }
  else if (act === "open-artist") go({ type: "artist", name: a.dataset.name });
  else if (act === "open-album") go({ type: "album", key: a.dataset.key });
  else if (act === "play-all") playList(curList, 0);
  else if (act === "shuffle-all") playList(curList, 0, true);
  else if (act === "add-songs" && p) go({ type: "pick", id: p.id });
  else if (act === "add-music") $("#fileInput").click();
  else if (act === "pl-copy" && p) { const np = { id: uid(), name: p.name, songIds: [...p.songIds], created: Date.now() }; playlists.push(np); savePl(np); toast(`Copied “${p.name}” to your playlists`); go({ type: "playlist", id: np.id }); }
  else if (act === "import-folder") $("#folderInput").click();
  else if (act === "clear-queue") { tracks = cur >= 0 ? [tracks[cur]] : []; cur = tracks.length ? 0 : -1; render(); }
  else if (act === "pl-more" && p) { e.stopPropagation(); menu(a, [{ label: "＋ Add songs", fn: () => go({ type: "pick", id: p.id }) }, { label: "✎  Rename", fn: () => renamePl(p) }, { label: "📁 Move to folder…", fn: () => folderMenu(a, p) }, Srv.on() && { label: p.shared ? "👪 Stop sharing with family" : "👪 Share with family", fn: () => { p.shared = !p.shared; savePl(p); toast(p.shared ? "Your family can now see and play this playlist" : "This playlist is private again"); render(); } }, "-", { label: "Delete playlist", danger: true, fn: () => deletePl(p) }]); }
});
// Drag songs to reorder a playlist
let dragI = -1;
V.addEventListener("dragstart", e => { const r = e.target.closest(".song"); if (!r || !rowCtx || !rowCtx.pl) return; dragI = +r.dataset.i; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "pulsewave-row"); r.classList.add("dragging"); });
V.addEventListener("dragover", e => { if (dragI < 0) return; e.preventDefault(); e.stopPropagation(); const r = e.target.closest(".song"); $$(".song.drop").forEach(x => x.classList.remove("drop")); if (r) r.classList.add("drop"); });
V.addEventListener("drop", e => { if (dragI < 0) return; e.preventDefault(); e.stopPropagation(); const r = e.target.closest(".song"), from = dragI; dragI = -1; if (r) movePl(rowCtx.pl, from, +r.dataset.i); else render(); });
V.addEventListener("dragend", () => { if (dragI >= 0) { dragI = -1; render(); } });
$$("#libNav button").forEach(b => b.onclick = () => go({ type: b.dataset.view }));
$("#libSearch").oninput = e => { query = e.target.value.trim(); render(); };
$("#folderInput").onchange = e => { importFolder(e.target.files); e.target.value = ""; };

(async () => {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch {}
  if (!await Srv.boot()) {
    songs = (await DB.all("songs")).filter(s => s.file instanceof Blob);
    const all = (await DB.all("playlists")).sort((a, b) => a.created - b.created);
    folders = all.filter(x => x.folder); playlists = all.filter(x => !x.folder);
  }
  libReady = true; render();
})();

/* ---------- Controls ---------- */
const fmt = s => isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";
$("#playBtn").onclick = toggle; $("#nextBtn").onclick = () => next(false); $("#prevBtn").onclick = prev;
audio.onplay = () => { $("#playBtn").textContent = "⏸"; $("#art").classList.add("spin"); };
audio.onpause = () => { $("#playBtn").textContent = "▶"; $("#art").classList.remove("spin"); };
audio.onended = () => next(true);
audio.onloadedmetadata = () => $("#durTime").textContent = fmt(audio.duration);
let seeking = false;
audio.ontimeupdate = () => { if (!seeking && audio.duration) $("#seek").value = audio.currentTime / audio.duration * 1000; $("#curTime").textContent = fmt(audio.currentTime); };
$("#seek").oninput = () => { seeking = true; $("#curTime").textContent = fmt($("#seek").value / 1000 * (audio.duration || 0)); };
$("#seek").onchange = () => { if (audio.duration) audio.currentTime = $("#seek").value / 1000 * audio.duration; seeking = false; };
const vol = $("#volume"); vol.value = store.get("vol", 80);
const setVol = () => { audio.volume = vol.value / 100; audio.muted = false; $("#muteBtn").textContent = vol.value == 0 ? "🔇" : vol.value < 50 ? "🔉" : "🔊"; store.set("vol", +vol.value); };
vol.oninput = setVol; setVol();
$("#muteBtn").onclick = () => { audio.muted = !audio.muted; $("#muteBtn").textContent = audio.muted ? "🔇" : "🔊"; };
const syncModes = () => {
  $("#shuffleBtn").classList.toggle("on", shuffle);
  $("#repeatBtn").classList.toggle("on", repeat !== "off");
  $("#repeatBtn").textContent = repeat === "one" ? "🔂" : "🔁";
  $("#repeatBtn").title = `Repeat: ${repeat} (R)`;
  store.set("shuffle", shuffle); store.set("repeat", repeat);
};
$("#shuffleBtn").onclick = () => { shuffle = !shuffle; syncModes(); };
$("#repeatBtn").onclick = () => { repeat = { off: "all", all: "one", one: "off" }[repeat]; syncModes(); };
syncModes();
["#fileInput", "#fileInput2"].forEach(s => $(s).onchange = e => { addFiles(e.target.files); e.target.value = ""; });

// Drag and drop
let dragN = 0;
addEventListener("dragenter", e => { if (!e.dataTransfer || ![...e.dataTransfer.types].includes("Files")) return; e.preventDefault(); dragN++; $("#dropOverlay").classList.remove("hidden"); });
addEventListener("dragleave", () => { if (!dragN) return; if (--dragN <= 0) { dragN = 0; $("#dropOverlay").classList.add("hidden"); } });
addEventListener("dragover", e => e.preventDefault());
addEventListener("drop", e => { e.preventDefault(); dragN = 0; $("#dropOverlay").classList.add("hidden"); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });

// Media keys / lock screen
if ("mediaSession" in navigator) {
  const ms = navigator.mediaSession;
  ms.setActionHandler("play", playNow); ms.setActionHandler("pause", () => audio.pause());
  ms.setActionHandler("nexttrack", () => next(false)); ms.setActionHandler("previoustrack", prev);
}

// Tabs
$$(".tabs button").forEach(b => b.onclick = () => {
  $$(".tabs button").forEach(x => x.classList.toggle("active", x === b));
  $$(".panel").forEach(p => p.classList.toggle("hidden", p.id !== "panel-" + b.dataset.tab));
});

/* ---------- Equalizer UI ---------- */
const bandsEl = $("#eqBands");
BANDS.forEach((f, i) => {
  const d = document.createElement("div"); d.className = "band";
  d.innerHTML = `<span class="val">0</span><input type="range" min="-12" max="12" step="1" value="0" aria-label="${f} Hz"><span>${f >= 1000 ? f / 1000 + "k" : f}</span>`;
  d.querySelector("input").oninput = e => { eqGains[i] = +e.target.value; $("#eqPreset").value = "Custom"; applyEq(); };
  bandsEl.appendChild(d);
});
const sel = $("#eqPreset");
sel.innerHTML = [...Object.keys(PRESETS), "Custom"].map(p => `<option>${p}</option>`).join("");
sel.value = store.get("preset", "Flat");
sel.onchange = () => { if (PRESETS[sel.value]) { eqGains = PRESETS[sel.value].slice(); applyEq(); } };
$("#eqReset").onclick = () => { sel.value = "Flat"; eqGains = PRESETS.Flat.slice(); applyEq(); };
const eqOn = $("#eqOn"); eqOn.checked = store.get("eqOn", true);
eqOn.onchange = applyEq;
$("#bassBoost").value = store.get("bass", 0);
$("#bassBoost").oninput = e => { if (bass) bass.gain.value = +e.target.value; store.set("bass", +e.target.value); };
$("#balance").oninput = setBalance;
function setBalance() { if (pan && pan.pan) pan.pan.value = $("#balance").value / 100; }
function applyEq() {
  $$(".band").forEach((d, i) => { d.querySelector("input").value = eqGains[i]; d.querySelector(".val").textContent = (eqGains[i] > 0 ? "+" : "") + eqGains[i]; });
  $("#panel-eq").classList.toggle("eq-off", !eqOn.checked);
  filters.forEach((f, i) => f.gain.setTargetAtTime(eqOn.checked ? eqGains[i] : 0, ctx.currentTime, 0.02));
  store.set("eq", eqGains); store.set("preset", sel.value); store.set("eqOn", eqOn.checked);
}
applyEq();

/* ---------- Now Playing screen: album art backdrop, art "flashes" and trivia ---------- */
const NP = (() => {
  const stage = $("#stage"), tv = $("#trivia"), cardTxt = $("#npTrivia");
  let track = null, facts = [], factI = 0, enabled = store.get("trivia", true), token = 0, remoteArt = null;
  let cardUntil = 0, cardOn = null, tvOn = false, lastFactAt = 0, lastCardFact = 0;
  const pick = () => facts.length ? facts[(factI++) % facts.length] : "";
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const near = (a, b) => { a = norm(a); b = norm(b); return !!a && !!b && (a.includes(b) || b.includes(a)); };

  function paint() {
    const t = track, a = t && t.art ? artUrl(t) : remoteArt || "logo.svg";
    $("#npArt").src = a; $("#npMiniArt").src = a;
    $("#npBg").style.backgroundImage = `url("${a}")`;
    $("#npTitle").textContent = $("#npMiniTitle").textContent = t ? t.title : C.name;
    $("#npSub").textContent = $("#npMiniSub").textContent = t ? [t.artist, t.album].filter(Boolean).join(" · ") : "Add music to begin";
  }
  function localFacts(t) {
    const f = [], n = songs.filter(s => s.artist === t.artist).length;
    if (t.year) f.push(`“${t.title}” is from ${t.year}.`);
    if (t.genre) f.push(`Genre: ${t.genre}.`);
    if (t.artist !== "Unknown artist" && n > 1) f.push(`You have ${n} songs by ${t.artist} in your library.`);
    if (t.plays > 1) f.push(`You've played “${t.title}” ${t.plays} times.`);
    return f;
  }
  async function lookup(t, my) {
    const local = localFacts(t), known = t.artist !== "Unknown artist";
    facts = local;
    if (!enabled) return;
    const key = "tv:" + norm(t.artist + "|" + t.title);
    let info = store.get(key, null);
    if (!info) {
      info = { facts: [] };
      try {   // Apple's public iTunes Search API: release date, album, genre and artwork
        const r = await fetch("https://itunes.apple.com/search?" + new URLSearchParams({ term: (known ? t.artist + " " : "") + t.title, entity: "song", limit: "5" }));
        const j = r.ok ? await r.json() : null;
        const it = j && (j.results || []).find(x => near(x.trackName, t.title) && (!known || near(x.artistName, t.artist)));
        if (it) {
          if (it.artworkUrl100) info.art = it.artworkUrl100.replace(/100x100bb/, "600x600bb");
          if (it.releaseDate) info.facts.push(`“${it.trackName}” by ${it.artistName} was released on ${new Date(it.releaseDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.`);
          if (it.collectionName && it.trackNumber && it.trackCount) info.facts.push(`It's track ${it.trackNumber} of ${it.trackCount} on “${it.collectionName}”.`);
          if (it.primaryGenreName) info.facts.push(`Apple Music files it under ${it.primaryGenreName}.`);
        }
      } catch {}
      if (known) try {   // Wikipedia summary about the artist
        const r = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(t.artist.replace(/ /g, "_")));
        const j = r.ok ? await r.json() : null;
        if (j && j.type === "standard" && j.extract && /singer|band|musician|rapper|group|songwriter|\bDJ\b|producer|composer|duo|record/i.test((j.description || "") + " " + j.extract))
          (j.extract.match(/[^.!?]+[.!?]+/g) || []).map(s => s.trim()).filter(s => s.length > 30).slice(0, 4).forEach(s => info.facts.push(s));
      } catch {}
      store.set(key, info);
    }
    if (my !== token) return;
    if (info.art && !t.art) { remoteArt = info.art; paint(); }
    facts = [...info.facts, ...local]; factI = 0;
  }
  function load(t) {
    track = t; remoteArt = null; facts = []; factI = 0; token++;
    paint(); cardUntil = performance.now() + 4500; lastFactAt = performance.now() - 8000; cardTxt.textContent = "";
    if (t) lookup(t, token);
  }
  // Called every frame while the lyrics view is open
  function frame(lines, synced, ct) {
    const now = performance.now();
    let card = now < cardUntil || !track || !lines.length;
    if (!card && synced && audio.duration) {   // flash the album art during instrumental breaks
      let i = -1; for (let j = 0; j < lines.length && lines[j].t <= ct; j++) i = j;
      const nextT = lines[i + 1] ? lines[i + 1].t : audio.duration;
      const lineEnd = i >= 0 ? lines[i].t + Math.max(3, lines[i].text.length * 0.12) : -1;
      if (nextT - ct > 4 && ct > lineEnd + 1) card = true;
    }
    if (card !== cardOn) {
      cardOn = card; stage.classList.toggle("show-card", card);
      if (card) { cardTxt.textContent = enabled ? pick() : ""; lastCardFact = now; }
    }
    if (card && enabled && facts.length && (!cardTxt.textContent || (facts.length > 1 && now - lastCardFact > 9000))) { cardTxt.textContent = pick(); lastCardFact = now; }
    // while singing, pop a small trivia bubble now and then
    if (!card && enabled && facts.length && !audio.paused) {
      if (!tvOn && now - lastFactAt > 20000) { $("#triviaText").textContent = pick(); tv.classList.add("on"); tvOn = true; lastFactAt = now; }
      else if (tvOn && now - lastFactAt > 8000) { tv.classList.remove("on"); tvOn = false; lastFactAt = now; }
    } else if (tvOn) { tv.classList.remove("on"); tvOn = false; }
  }
  return {
    load, frame, refresh: paint,
    enabled: () => enabled,
    enable(v) { enabled = v; store.set("trivia", v); if (!v) { cardTxt.textContent = ""; tv.classList.remove("on"); tvOn = false; } if (track) lookup(track, ++token); }
  };
})();

/* ---------- Lyrics overlay ---------- */
const Lyrics = (() => {
  const el = $("#lyrics"), box = $("#lyricsLines"), status = $("#lyStatus"), ta = $("#lyText");
  let lines = [], synced = false, idx = -2, track = null, offset = 0;
  let show = store.get("lyShow", true), online = store.get("lyOnline", true), size = store.get("lySize", 100);
  const key = t => "ly:" + (t.artist + "|" + t.title).toLowerCase();

  const T = (m, s) => +m * 60 + parseFloat(String(s).replace(":", "."));
  function words(txt) {   // enhanced LRC word timing: <mm:ss.xx>word
    if (!/<\d+:\d/.test(txt)) return { text: txt, words: null };
    const ws = [], re = /<(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)>([^<]*)/g; let m;
    while ((m = re.exec(txt))) if (m[3].trim()) ws.push({ t: T(m[1], m[2]), text: m[3].trim() });
    return { text: ws.map(w => w.text).join(" "), words: ws.length ? ws : null };
  }
  function parse(text) {
    const out = []; let off = 0, any = false;
    (text || "").replace(/\r/g, "").split("\n").forEach(raw => {
      const o = raw.match(/^\[offset:\s*([+-]?\d+)\]/i); if (o) { off = +o[1] / 1000; return; }
      const tags = [...raw.matchAll(/\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];
      const txt = raw.replace(/\[[^\]]*\]/g, "").trim();
      if (tags.length) { any = true; tags.forEach(m => { const w = words(txt); out.push({ t: T(m[1], m[2]), text: w.text, words: w.words }); }); }
      else if (txt && !/^\[\w+:.*\]$/.test(raw.trim())) out.push({ t: null, text: words(txt).text });
    });
    if (any) { const s = out.filter(l => l.t != null).sort((a, b) => a.t - b.t); s.forEach(l => { l.t -= off; if (l.words) l.words.forEach(w => w.t -= off); }); return { lines: s, synced: true }; }
    return { lines: out, synced: false };
  }

  // Read lyrics embedded in an MP3's ID3v2 tag (USLT frame)
  async function fromId3(file) {
    if (!file || !/\.mp3$/i.test(file.name)) return null;
    const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
    if (String.fromCharCode(...head.slice(0, 3)) !== "ID3") return null;
    const ver = head[3], ss = (b, i) => (b[i] << 21) | (b[i + 1] << 14) | (b[i + 2] << 7) | b[i + 3];
    const size = ss(head, 6), b = new Uint8Array(await file.slice(10, 10 + size).arrayBuffer());
    const dec = (enc, bytes) => {
      try {
        if (enc === 0) return new TextDecoder("latin1").decode(bytes);
        if (enc === 3) return new TextDecoder("utf-8").decode(bytes);
        if (enc === 2) return new TextDecoder("utf-16be").decode(bytes);
        return new TextDecoder(bytes[0] === 0xfe ? "utf-16be" : "utf-16le").decode(bytes.slice(2));
      } catch { return ""; }
    };
    for (let p = 0; p + 10 < b.length;) {
      const id = String.fromCharCode(...b.slice(p, p + 4)); if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const fs = ver >= 4 ? ss(b, p + 4) : (b[p + 4] << 24 | b[p + 5] << 16 | b[p + 6] << 8 | b[p + 7]) >>> 0;
      if (id === "USLT" || id === "TXXX") {
        // USLT: encoding, language, descriptor, text. TXXX: encoding, descriptor, value (some taggers put lyrics here)
        const f = b.slice(p + 10, p + 10 + fs), enc = f[0], wide = enc === 1 || enc === 2;
        let q = id === "USLT" ? 4 : 1; const d0 = q;
        if (wide) { while (q + 1 < f.length && !(f[q] === 0 && f[q + 1] === 0)) q += 2; q += 2; }
        else { while (q < f.length && f[q] !== 0) q++; q++; }
        const desc = dec(enc, f.slice(d0, q)).replace(/\0/g, "");
        if (id === "TXXX" && !/lyric|uslt/i.test(desc)) { p += 10 + fs; continue; }
        const txt = dec(enc, f.slice(q)).replace(/\0/g, "").trim(); if (txt) return txt;
      }
      p += 10 + fs;
    }
    return null;
  }

  async function fromOnline(t) {
    const dur = Math.round(audio.duration || 0), qp = new URLSearchParams({ track_name: t.title });
    if (t.artist !== "Unknown artist") qp.set("artist_name", t.artist);
    if (dur) qp.set("duration", dur);
    try {
      let r = await fetch("https://lrclib.net/api/get?" + qp);
      if (r.ok) { const j = await r.json(); if (j.syncedLyrics || j.plainLyrics) return j.syncedLyrics || j.plainLyrics; }
      r = await fetch("https://lrclib.net/api/search?q=" + encodeURIComponent((t.artist !== "Unknown artist" ? t.artist + " " : "") + t.title));
      if (r.ok) { const j = (await r.json()).find(x => x.syncedLyrics || x.plainLyrics); if (j) return j.syncedLyrics || j.plainLyrics; }
    } catch {}
    return null;
  }

  function set(text, src) {
    const p = parse(text); lines = p.lines; synced = p.synced; idx = -2;
    box.innerHTML = "";
    lines.forEach(l => {
      const d = document.createElement("div"); d.className = "ly-line";
      const ws = l.words ? l.words.map(w => w.text) : (l.text || "♪").split(/\s+/).filter(Boolean);
      l.chars = [];
      l.spans = ws.map((w, k) => {
        if (k) d.appendChild(document.createTextNode(" "));
        const s = document.createElement("span"); s.className = "w";
        l.chars.push([...w].map(ch => { const c = document.createElement("span"); c.className = "c"; c.textContent = ch; s.appendChild(c); return c; }));
        d.appendChild(s); return s;
      });
      const total = ws.reduce((a, w) => a + w.length + 1, 0) || 1; let acc = 0;
      l.cum = ws.map(w => { const a = acc / total; acc += w.length + 1; return [a, acc / total]; });
      box.appendChild(d);
    });
    ta.value = text || "";
    status.textContent = lines.length ? `${src} · ${synced ? "synced" : "not synced (scrolls with the song)"}` : "No lyrics found. Paste some below, or add a .lrc file.";
    el.classList.toggle("empty", !lines.length);
    offset = track ? store.get(key(track) + ":off", 0) : 0; $("#lyOffset").textContent = offset.toFixed(1) + " s";
  }

  async function load(t) {
    NP.load(t);
    track = t; set("", ""); status.textContent = "Looking for lyrics…";
    if (!t) { status.textContent = "Play a song to see its lyrics."; return; }
    if (!t.lrc && t.remote && t.hasLrc) { try { t.lrc = t._lrcSent = await Srv.lyrics(t); } catch {} if (track !== t) return; }
    let text = t.lrc || store.get(key(t), null), src = t.remote && t.lrc ? "From the family server" : "Saved";
    if (!text) { text = await fromId3(t.file).catch(() => null); src = "From the song file"; }
    if (!text && online) { text = await fromOnline(t); src = "From LRCLIB"; }
    if (track !== t) return;           // the song changed while we were searching
    set(text, src);
  }

  const pv = { line: -1, p: 0, now: 0, ct: 0 };
  let follow = store.get("lyFollow", true);
  function tick() {
    requestAnimationFrame(tick);
    if (show) NP.frame(lines, synced, audio.currentTime + offset);
    if (!show || !lines.length || !audio.duration) return;
    const ct = audio.currentTime + offset;
    let i;
    if (synced) { i = -1; for (let j = 0; j < lines.length && lines[j].t <= ct; j++) i = j; }
    else i = Math.min(lines.length - 1, Math.floor((ct / audio.duration) * lines.length * 1.05));
    el.style.setProperty("--beat", Math.min(1, beat || 0).toFixed(2));
    if (i !== idx) {
      if (lines[idx] && lines[idx].spans) lines[idx].spans.forEach(s => s.className = "w");
      idx = i;
      [...box.children].forEach((d, j) => { const dist = Math.abs(j - i); d.className = "ly-line" + (j === i ? " cur" : dist === 1 ? " near" : dist > 3 ? " far" : ""); });
      const c = box.children[Math.max(0, i)];
      if (c) box.style.transform = `translateY(${-(c.offsetTop + c.offsetHeight / 2)}px)`;
    }
    if (!synced || i < 0) return;
    // Karaoke sweep: colour each word as it is sung
    const L = lines[i], nx = lines[i + 1], clamp = v => Math.max(0, Math.min(1, v));
    let wi = 0, wp = 0;
    if (L.words) {
      wi = -1; for (let k = 0; k < L.words.length; k++) if (L.words[k].t <= ct) wi = k;
      if (wi < 0) wi = 0;
      else { const st = L.words[wi].t, en = L.words[wi + 1] ? L.words[wi + 1].t : Math.min(nx ? nx.t : Infinity, st + 1.2); wp = clamp((ct - st) / Math.max(0.05, en - st)); }
    } else {
      const dur = Math.max(0.8, Math.min((nx ? nx.t : audio.duration) - L.t, Math.max(1.5, L.text.length * 0.11)));
      const lin = clamp((ct - L.t) / dur), now = performance.now();
      let p = lin;
      if (follow && midAn) {
        // move while the singer is singing, nearly stop while they pause, but never drift far from the line's timing
        if (pv.line !== i || ct < pv.ct - 0.3) Object.assign(pv, { line: i, p: lin });
        const dt = audio.paused ? 0 : Math.min(0.1, (now - pv.now) / 1000);
        pv.p += dt / (dur * 0.75) * (voiceOn ? 1.1 : 0.1);
        pv.p = Math.min(Math.max(pv.p, lin - 0.2), lin + 0.3, 1);
        p = pv.p;
      }
      pv.now = now; pv.ct = ct;
      wi = L.cum.findIndex(c => p < c[1]);
      if (wi < 0) { wi = L.spans.length - 1; wp = 1; } else wp = clamp((p - L.cum[wi][0]) / (L.cum[wi][1] - L.cum[wi][0]));
    }
    L.spans.forEach((s, k) => { const c = k < wi || (k === wi && wp >= 1) ? "w sung" : k === wi ? "w sing" : "w"; if (s.className !== c) s.className = c; });
    // letters: lit up to the singer's position, the current letter fills part-way
    L.chars.forEach((cs, k) => {
      const pos = k < wi ? cs.length : k > wi ? 0 : wp * cs.length, full = Math.floor(pos);
      cs.forEach((c, j) => { const cl = j < full ? "c on" : j === full && pos > full ? "c part" : "c"; if (c.className !== cl) c.className = cl; if (cl === "c part") c.style.setProperty("--cp", ((pos - full) * 100).toFixed(0) + "%"); });
    });
  }
  requestAnimationFrame(tick);

  function apply() {
    $("#lyricsBtn").classList.toggle("active", show);
    $("#stage").classList.toggle("lyrics-view", show);
    // Visual effects move down behind the play controls while reading lyrics
    const cv = $("#viz"), home = show ? $("#player") : $("#stage");
    if (cv.parentElement !== home) home.insertBefore(cv, home.firstChild);
    NP.refresh();
    el.style.setProperty("--ly", size / 100); $("#lySize").value = size; $("#lyOnline").checked = online; idx = -2;
    store.set("lyShow", show); store.set("lyOnline", online); store.set("lySize", size);
  }
  $("#lyricsBtn").onclick = () => { show = !show; apply(); };
  $("#triviaOn").checked = NP.enabled(); $("#triviaOn").onchange = e => NP.enable(e.target.checked);
  $("#karaokeBtn").onclick = () => { setKaraoke(!karaoke); if (karaoke) { if (!show) { show = true; apply(); } toast("Karaoke mode on: the singer's voice is turned down"); } else toast("Karaoke mode off"); };
  $("#karaokeOn").onchange = e => setKaraoke(e.target.checked);
  setKaraoke(karaoke);
  $("#lyOnline").onchange = e => { online = e.target.checked; apply(); };
  $("#lySize").oninput = e => { size = +e.target.value; apply(); };
  $("#lyFollow").checked = follow; $("#lyFollow").onchange = e => { follow = e.target.checked; store.set("lyFollow", follow); };
  // Lyrics font
  const FONTS = { "System": "system-ui,-apple-system,'Segoe UI',sans-serif", "Poppins": "'Poppins',sans-serif", "Montserrat": "'Montserrat',sans-serif",
    "Bebas Neue": "'Bebas Neue',sans-serif", "Oswald": "'Oswald',sans-serif", "Playfair Display": "'Playfair Display',serif", "Lora": "'Lora',serif",
    "Pacifico": "'Pacifico',cursive", "Caveat": "'Caveat',cursive", "Permanent Marker": "'Permanent Marker',cursive", "Bungee": "'Bungee',sans-serif",
    "Comfortaa": "'Comfortaa',sans-serif", "Press Start 2P": "'Press Start 2P',monospace" };
  const ONE_WEIGHT = ["Bebas Neue", "Pacifico", "Permanent Marker", "Bungee", "Press Start 2P"];
  const fsel = $("#lyFont");
  fsel.innerHTML = Object.keys(FONTS).map(f => `<option>${f}</option>`).join("");
  function setFont(f) {
    if (!FONTS[f]) f = "System";
    fsel.value = f; store.set("lyFont", f);
    if (f !== "System" && !document.getElementById("gf-" + f)) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.id = "gf-" + f;
      l.href = "https://fonts.googleapis.com/css2?family=" + f.replace(/ /g, "+") + (ONE_WEIGHT.includes(f) ? "" : ":wght@500;700;800") + "&display=swap";
      document.head.appendChild(l);
    }
    el.style.setProperty("--ly-font", FONTS[f]);
    el.style.setProperty("--ly-scale", f === "Press Start 2P" ? ".62" : f === "Bebas Neue" || f === "Oswald" ? "1.15" : "1");
    idx = -2;
  }
  fsel.onchange = () => setFont(fsel.value);
  setFont(store.get("lyFont", "System"));
  const caps = $("#lyCaps"); caps.checked = store.get("lyCaps", false);
  const setCaps = () => { el.classList.toggle("caps", caps.checked); store.set("lyCaps", caps.checked); idx = -2; };
  caps.onchange = setCaps; setCaps();

  /* --- Tap to time: tap on every word as it is sung to make exact word timing --- */
  const TT = { on: false, rows: [], li: 0, wi: 0 };
  const lrcTime = t => { t = Math.max(0, t); const m = Math.floor(t / 60), s = (t % 60).toFixed(2).padStart(5, "0"); return `${String(m).padStart(2, "0")}:${s}`; };
  function ttRender() {
    const r = TT.rows[TT.li], box2 = $("#ttLines");
    if (!r) { box2.innerHTML = "<p class='tt-done'>✓ All lines timed. Press <b>Save</b>.</p>"; return; }
    const prev = TT.rows[TT.li - 1], next = TT.rows[TT.li + 1];
    const words = r.words.map((w, k) => `<span class="${k < TT.wi ? "done" : k === TT.wi ? "tt-now" : ""}">${esc(w)}</span>`).join(" ");
    box2.innerHTML = (prev ? `<p class="tt-dim">${esc(prev.words.join(" "))}</p>` : "") + `<p class="tt-cur">${words}</p>` + (next ? `<p class="tt-dim">${esc(next.words.join(" "))}</p>` : "");
    $("#ttCount").textContent = `Line ${TT.li + 1} of ${TT.rows.length}`;
  }
  function ttStart() {
    if (!track || !lines.length) { toast("Load lyrics for this song first"); return; }
    TT.rows = lines.filter(l => l.text && l.text !== "♪").map(l => ({ words: (l.words ? l.words.map(w => w.text) : l.text.split(/\s+/)).filter(Boolean), times: [], t: l.t }));
    TT.li = 0; TT.wi = 0; TT.on = true;
    $("#ttPanel").classList.remove("hidden"); if (!show) { show = true; apply(); }
    const first = TT.rows[0] && TT.rows[0].t != null ? Math.max(0, TT.rows[0].t - 3) : 0;
    audio.currentTime = first; playNow(); ttRender();
  }
  function ttTap() {
    if (!TT.on) return;
    const r = TT.rows[TT.li]; if (!r) return;
    r.times[TT.wi] = audio.currentTime; TT.wi++;
    if (TT.wi >= r.words.length) { TT.li++; TT.wi = 0; }
    ttRender();
  }
  function ttUndo() {
    if (TT.wi > 0) TT.wi--; else if (TT.li > 0) { TT.li--; TT.wi = TT.rows[TT.li].words.length - 1; } else return;
    const t = TT.rows[TT.li].times[TT.wi]; TT.rows[TT.li].times.length = TT.wi;
    if (t != null) audio.currentTime = Math.max(0, t - 2);
    ttRender();
  }
  function ttStop() { TT.on = false; $("#ttPanel").classList.add("hidden"); }
  function ttSave() {
    const out = [];
    TT.rows.forEach(r => {
      if (r.times.length) out.push(`[${lrcTime(r.times[0])}] ` + r.words.map((w, k) => r.times[k] != null ? `<${lrcTime(r.times[k])}>${w}` : w).join(" "));
      else if (r.t != null) out.push(`[${lrcTime(r.t)}] ${r.words.join(" ")}`);
    });
    if (!TT.rows.some(r => r.times.length)) { toast("Tap along first. Nothing was timed."); return; }
    const text = out.join("\n");
    track.lrc = text; track.mtime = Date.now(); saveSong(track); store.set(key(track), text);
    offset = 0; store.set(key(track) + ":off", 0);
    set(text, "Timed by you"); ttStop(); toast("Word timing saved");
  }
  $("#ttStartBtn").onclick = ttStart;
  $("#ttTap").onclick = ttTap; $("#ttUndo").onclick = ttUndo; $("#ttSave").onclick = ttSave; $("#ttCancel").onclick = ttStop;
  $("#ttBack").onclick = () => { audio.currentTime = Math.max(0, audio.currentTime - 5); };
  addEventListener("keydown", e => {   // while timing: Space / Enter = tap, Backspace = undo
    if (!TT.on || e.target.matches("input,textarea,select")) return;
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); e.stopImmediatePropagation(); ttTap(); }
    else if (e.key === "Backspace") { e.preventDefault(); e.stopImmediatePropagation(); ttUndo(); }
    else if (e.key === "Escape") { e.stopImmediatePropagation(); ttStop(); }
  }, true);
  $("#lySave").onclick = () => { if (!track) return; store.set(key(track), ta.value); track.lrc = ta.value; track.mtime = Date.now(); saveSong(track); set(ta.value, "Saved"); };
  $("#lySearch").onclick = async () => { if (!track) return; status.textContent = "Searching LRCLIB…"; const t = await fromOnline(track); t ? set(t, "From LRCLIB") : (status.textContent = "Nothing found online for this song."); };
  $("#lyForget").onclick = () => { if (!track) return; try { localStorage.removeItem("pw." + key(track)); } catch {} load(track); };
  $("#lyFile").onchange = async e => { const f = e.target.files[0]; e.target.value = ""; if (f && track) { track.lrc = await f.text(); track.mtime = Date.now(); saveSong(track); set(track.lrc, "From .lrc file"); } };
  const nudge = d => { offset = Math.round((offset + d) * 10) / 10; $("#lyOffset").textContent = offset.toFixed(1) + " s"; if (track) store.set(key(track) + ":off", offset); idx = -2; };
  $("#lyEarlier").onclick = () => nudge(0.5); $("#lyLater").onclick = () => nudge(-0.5);
  apply();
  return { load, toggle: () => $("#lyricsBtn").click() };
})();

/* ---------- Sync between devices (QR pairing, direct device-to-device with WebRTC) ---------- */
const Sync = (() => {
  const SITE = "https://pulsewave.ryanbarnal.com/";
  const ALPH = "abcdefghjkmnpqrstuvwxyz23456789";
  const rid = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => ALPH[b % ALPH.length]).join("");
  let devId = store.get("devId", null); if (!devId) { devId = rid(6); store.set("devId", devId); }
  const ua = navigator.userAgent;
  const devName = (/iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android phone" : /Windows/.test(ua) ? "Windows PC" : /Mac/.test(ua) ? "Mac" : "Computer") + (/Electron/.test(ua) ? " (app)" : " (browser)");
  let peer = null, myCode = devId, onReady = [], dialing = false, wasBusy = false, changeT = 0, renderT = 0;
  const conns = new Map();
  const keyOf = s => s.size + ":" + s.fname;
  const tombs = () => store.get("tomb", {});
  const devices = () => store.get("devices", []);
  const live = () => [...conns.values()].filter(c => c.open && c.dev);
  const setState = t => { $("#syncState").textContent = t; };
  const CHUNK = 64 * 1024;
  const tx = (conn, obj) => conn.send(JSON.stringify(obj));
  const drain = conn => new Promise(res => {               // wait while the channel's send buffer is full
    const dc = conn.dataChannel, check = () => (!dc || dc.bufferedAmount < 4 * 1024 * 1024 || !conn.open) ? res() : setTimeout(check, 15);
    check();
  });

  /* --- what this device has --- */
  const songMeta = s => ({ id: s.id, key: keyOf(s), fname: s.fname, size: s.size, title: s.title, artist: s.artist, album: s.album, duration: s.duration,
    year: s.year || "", genre: s.genre || "", fav: !!s.fav, added: s.added || 0, lrc: s.lrc || null, mtime: s.mtime || 0 });
  function manifest() {
    const byId = new Map(songs.map(s => [s.id, s]));
    return { type: "manifest", songs: songs.map(songMeta), tomb: tombs(),
      pls: [...folders, ...playlists].map(p => ({ id: p.id, name: p.name, folder: !!p.folder, folderId: p.folderId || null, created: p.created || 0,
        updated: p.updated || p.created || 0, songKeys: p.folder ? [] : p.songIds.map(id => byId.get(id)).filter(Boolean).map(keyOf) })) };
  }

  /* --- merge what the other device has --- */
  function applyManifest(conn, m) {
    const T = tombs(); let changed = false;
    for (const [k, t] of Object.entries(m.tomb || {})) {          // deletions made on the other device
      if ((T[k] || 0) < t) T[k] = t;
      const s = songs.find(x => keyOf(x) === k);
      if (s && Math.max(s.added || 0, s.mtime || 0) < t) { removeSongLocal(s); changed = true; }
      const p = playlists.find(x => x.id === k) || folders.find(x => x.id === k);
      if (p && (p.updated || p.created || 0) < t) { removePlLocal(p); changed = true; }
    }
    store.set("tomb", T);
    const byKey = new Map(songs.map(s => [keyOf(s), s])), remoteId = {}, want = [];
    for (const r of m.songs || []) {
      remoteId[r.key] = r.id;
      if ((T[r.key] || 0) >= Math.max(r.added || 0, r.mtime || 0)) continue;
      const s = byKey.get(r.key);
      if (!s) { if (!conn.asked.has(r.key)) { conn.asked.add(r.key); want.push(r.key); } continue; }
      if ((r.mtime || 0) > (s.mtime || 0)) { s.fav = r.fav; s.lrc = r.lrc; s.mtime = r.mtime; saveSong(s, true); changed = true; }
    }
    for (const r of m.pls || []) {                                  // playlists and folders: newest edit wins
      if ((T[r.id] || 0) >= r.updated) continue;
      const arr = r.folder ? folders : playlists;
      let p = arr.find(x => x.id === r.id);
      if (p && (p.updated || p.created || 0) >= r.updated) continue;
      if (!p) { p = { id: r.id }; arr.push(p); }
      Object.assign(p, { name: r.name, created: r.created, updated: r.updated });
      if (r.folder) p.folder = true;
      else p.songIds = r.songKeys.map(k => byKey.has(k) ? byKey.get(k).id : remoteId[k]).filter(Boolean);
      if (r.folderId) p.folderId = r.folderId; else delete p.folderId;
      savePl(p, true); changed = true;
    }
    if (changed) render();
    if (want.length) { conn.wantTotal += want.length; tx(conn, { type: "want", keys: want }); }
    progress();
  }
  function receiveChunk(conn, buf) {
    const inc = conn.inc; if (!inc) return;
    inc.parts.push(buf); inc.got += buf.byteLength;
    if (inc.got < inc.artSize + inc.fileSize) return;
    conn.inc = null;
    const all = new Blob(inc.parts);
    inc.msg.art = inc.artSize ? all.slice(0, inc.artSize, inc.msg.artType || "image/jpeg") : null;
    inc.msg.file = all.slice(inc.artSize);
    receiveSong(conn, inc.msg).catch(() => {});
  }
  async function receiveSong(conn, msg) {
    const r = msg.meta;
    if (!songs.some(x => keyOf(x) === r.key)) {
      const s = { id: songs.some(x => x.id === r.id) ? uid() : r.id, fname: r.fname, size: r.size, title: r.title, artist: r.artist, album: r.album,
        duration: r.duration, year: r.year, genre: r.genre, fav: r.fav, added: r.added, lrc: r.lrc, mtime: r.mtime,
        file: new File([msg.file], r.fname, { type: msg.fileType || "" }), art: msg.art || null };
      songs.push(s); await saveSong(s, true);
    }
    conn.got++; tx(conn, { type: "got" }); progress();
    clearTimeout(renderT); renderT = setTimeout(render, 400);
  }
  async function pump(conn) {                                       // send requested songs one at a time
    if (conn.sending || !conn.out.length || !conn.open) return;
    const k = conn.out.shift(), s = songs.find(x => keyOf(x) === k);
    if (!s) { conn.sent++; progress(); return pump(conn); }
    conn.sending = true;
    try {
      const art = s.art || new Blob([]), file = s.file;
      tx(conn, { type: "song", meta: songMeta(s), fileType: file.type, artType: s.art ? s.art.type : null, artSize: art.size, fileSize: file.size });
      for (const part of [art, file])
        for (let o = 0; o < part.size; o += CHUNK) { await drain(conn); if (!conn.open) throw 0; conn.send(await part.slice(o, o + CHUNK).arrayBuffer()); }
    } catch { conn.sending = false; conn.sent++; progress(); pump(conn); }
  }

  /* --- connections --- */
  function setup(conn) {
    Object.assign(conn, { asked: new Set(), out: [], sending: false, wantTotal: 0, got: 0, sendTotal: 0, sent: 0, dev: null });
    conns.set(conn.connectionId, conn);
    conn.on("open", () => { dialing = false; tx(conn, { type: "hello", id: myCode, name: devName }); tx(conn, manifest()); });
    conn.on("data", d => {
      if (typeof d === "string") { let m; try { m = JSON.parse(d); } catch { return; } handle(conn, m).catch(() => {}); }
      else if (d instanceof ArrayBuffer) receiveChunk(conn, d);
      else if (d && d.buffer instanceof ArrayBuffer) receiveChunk(conn, d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength));
    });
    conn.on("close", () => { conns.delete(conn.connectionId); renderDevices(); progress(); if (!live().length) setState("Ready. Waiting for your other device…"); });
    conn.on("error", () => {});
  }
  async function handle(conn, m) {
    if (!m || !m.type) return;
    if (m.type === "hello") {
      conn.dev = m.id; conn.devName = m.name;
      for (const c of conns.values()) if (c !== conn && c.dev === m.id && c.open) {   // both sides dialled: keep one link
        const drop = c.connectionId < conn.connectionId ? conn : c; drop.close(); if (drop === conn) return;
      }
      const list = devices().filter(d => d.id !== m.id); list.unshift({ id: m.id, name: m.name, last: Date.now() }); store.set("devices", list);
      setState(`Connected to ${m.name}`); toast(`⇄ Connected to ${m.name}`); renderDevices();
    } else if (m.type === "manifest") applyManifest(conn, m);
    else if (m.type === "want") { (m.keys || []).forEach(k => conn.out.push(k)); conn.sendTotal += (m.keys || []).length; progress(); pump(conn); }
    else if (m.type === "song") { conn.inc = { msg: m, parts: [], got: 0, artSize: m.artSize || 0, fileSize: m.fileSize || 0 }; if (!m.artSize && !m.fileSize) receiveChunk(conn, new ArrayBuffer(0)); }
    else if (m.type === "got") { conn.sending = false; conn.sent++; progress(); pump(conn); }
  }
  function start() {
    if (peer || typeof Peer === "undefined") { if (typeof Peer === "undefined") setState("Sync isn't available in this browser."); return; }
    const ph = new URLSearchParams(location.search).get("peerhost") || store.get("peerHost", "");
    const opts = { debug: 0 };
    if (ph) { const [h, p] = ph.split(":"); Object.assign(opts, { host: h, port: +p || 9000, path: "/", secure: false }); }
    peer = new Peer("pulsewave-" + myCode, opts);
    setState("Connecting to the sync service…");
    peer.on("open", () => { setState(live().length ? `Connected to ${live()[0].devName}` : "Ready. Waiting for your other device…"); const q = onReady; onReady = []; q.forEach(f => f()); autoDial(); });
    peer.on("connection", setup);
    peer.on("disconnected", () => { setTimeout(() => { if (peer && !peer.destroyed && peer.disconnected) peer.reconnect(); }, 3000); });
    peer.on("error", e => {
      if (e.type === "unavailable-id") { peer.destroy(); peer = null; myCode = rid(6); showCode(); return start(); }   // e.g. a second tab
      if (e.type === "peer-unavailable") { if (dialing) { dialing = false; setState("Couldn't reach that device. Make sure Pulsewave is open on it, then try again."); } return; }
      if (e.type === "network" || e.type === "server-error" || e.type === "socket-error") setState("Can't reach the sync service. Check your internet connection.");
    });
  }
  function dial(code, manual) {
    code = String(code || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!code || code === myCode) { if (manual) setState("That's this device's own code. Enter the code shown on your other device."); return; }
    if (live().some(c => c.dev === code)) return;
    const go = () => { if (manual) { dialing = true; setState(`Connecting to ${code.toUpperCase()}…`); } setup(peer.connect("pulsewave-" + code, { reliable: true, serialization: "raw" })); };
    if (peer && peer.open) go(); else { onReady.push(go); start(); }
  }
  function autoDial() { if (!Srv.on() && store.get("syncAuto", true)) devices().forEach(d => { if (!live().some(c => c.dev === d.id)) dial(d.id); }); }
  setInterval(() => { if (peer && peer.open && devices().length) autoDial(); }, 45000);

  /* --- UI --- */
  function progress() {
    let rt = 0, rg = 0, st = 0, ss = 0;
    for (const c of conns.values()) { rt += c.wantTotal; rg += c.got; st += c.sendTotal; ss += c.sent; }
    const busy = rg < rt || ss < st, box = $("#syncProgress");
    $("#syncBtn").classList.toggle("linked", live().length > 0); $("#syncBtn").classList.toggle("busy", busy);
    if (rt || st) {
      box.classList.remove("hidden");
      $("#syncBar").style.width = Math.round((rg + ss) / Math.max(1, rt + st) * 100) + "%";
      $("#syncProgText").textContent = busy ? [rt ? `Receiving ${rg} of ${rt} songs` : "", st ? `Sending ${ss} of ${st} songs` : ""].filter(Boolean).join(" · ") : `✓ Up to date (${rg} received, ${ss} sent)`;
    }
    if (wasBusy && !busy) toast("⇄ Sync complete");
    if (!busy && live().length) { const ids = live().map(c => c.dev); store.set("devices", devices().map(d => ids.includes(d.id) ? { ...d, last: Date.now() } : d)); renderDevices(); }
    wasBusy = busy;
  }
  function ago(t) { const s = (Date.now() - t) / 1000; return s < 60 ? "just now" : s < 3600 ? Math.floor(s / 60) + " min ago" : s < 86400 ? Math.floor(s / 3600) + " hr ago" : new Date(t).toLocaleDateString(); }
  function renderDevices() {
    const ul = $("#syncDevices"), list = devices();
    ul.innerHTML = list.length ? list.map(d => { const on = live().some(c => c.dev === d.id);
      return `<li><span class="dot${on ? " on" : ""}"></span><span class="dn"><b>${esc(d.name)}</b><small>${on ? "Connected" : "Last synced " + ago(d.last)} · code ${esc(d.id.toUpperCase())}</small></span>
        ${on ? "" : `<button class="btn" data-sync="${esc(d.id)}">Sync now</button>`}<button class="btn" data-forget="${esc(d.id)}" title="Forget this device">✕</button></li>`; }).join("")
      : `<li class="muted">No devices paired yet.</li>`;
    $("#syncBtn").classList.toggle("linked", live().length > 0);
  }
  function showCode() {
    $("#syncCode").textContent = myCode.toUpperCase();
    const base = location.protocol.startsWith("http") ? location.origin + location.pathname : SITE;
    const url = base + "?pair=" + myCode;
    try { const qr = qrcode(0, "M"); qr.addData(url); qr.make(); $("#syncQr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { $("#syncQr").textContent = ""; }
    $("#syncQr").title = url;
  }
  function open() {
    if (Srv.on()) { toast("You're using the family server, so your music is already on every device you sign in on. Sync is for this device's own library."); return; }
    start(); showCode(); renderDevices(); progress(); $("#syncModal").classList.remove("hidden");
  }
  $("#syncBtn").onclick = open;
  $("#syncClose").onclick = () => $("#syncModal").classList.add("hidden");
  $("#syncModal").onclick = e => { if (e.target.id === "syncModal") $("#syncModal").classList.add("hidden"); };
  $("#syncJoin").onclick = () => dial($("#syncInput").value, true);
  $("#syncInput").onkeydown = e => { if (e.key === "Enter") $("#syncJoin").click(); };
  $("#syncAuto").checked = store.get("syncAuto", true);
  $("#syncAuto").onchange = e => { store.set("syncAuto", e.target.checked); if (e.target.checked) autoDial(); };
  $("#syncDevices").onclick = e => {
    const s = e.target.closest("[data-sync]"), f = e.target.closest("[data-forget]");
    if (s) dial(s.dataset.sync, true);
    if (f) { store.set("devices", devices().filter(d => d.id !== f.dataset.forget)); live().filter(c => c.dev === f.dataset.forget).forEach(c => c.close()); renderDevices(); }
  };

  // Opened from a scanned QR code (…/?pair=CODE)? Connect straight away.
  const pair = new URLSearchParams(location.search).get("pair");
  if (pair) { history.replaceState(null, "", location.pathname + location.search.replace(/[?&]pair=[^&]*/, "").replace(/^&/, "?")); open(); dial(pair, true); }
  else if (devices().length && store.get("syncAuto", true)) start();

  return {
    changed() { clearTimeout(changeT); changeT = setTimeout(() => { const m = JSON.stringify(manifest()); live().forEach(c => c.send(m)); }, 1500); },
    open
  };
})();
window.__pwSync = Sync;

/* ---------- Visualizer ---------- */
const THEMES = [
  { name: "Neon", c: ["#7c3aed", "#06b6d4"], h: [265, 190] },
  { name: "Sunset", c: ["#f43f5e", "#fbbf24"], h: [345, 405] },
  { name: "Forest", c: ["#10b981", "#84cc16"], h: [160, 85] },
  { name: "Ocean", c: ["#3b82f6", "#22d3ee"], h: [220, 185] },
  { name: "Candy", c: ["#ec4899", "#8b5cf6"], h: [325, 260] }
];
let theme = store.get("theme", 1), mode = store.get("mode", "bars");
const MODES = ["bars", "wave", "radial", "galaxy", "tunnel"];
const td = $("#themeDots");
THEMES.forEach((t, i) => {
  const b = document.createElement("button"); b.title = t.name; b.style.background = `linear-gradient(135deg,${t.c[0]},${t.c[1]})`;
  b.onclick = () => setTheme(i); td.appendChild(b);
});
function setTheme(i) {
  theme = i; store.set("theme", i);
  $$("#themeDots button").forEach((b, j) => b.classList.toggle("active", j === i));
  document.documentElement.style.setProperty("--a1", THEMES[i].c[0]);
  document.documentElement.style.setProperty("--a2", THEMES[i].c[1]);
}
function setMode(m) { mode = m; store.set("mode", m); $$("#vizModes [data-mode]").forEach(b => b.classList.toggle("active", b.dataset.mode === m)); }
$$("#vizModes [data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
setTheme(theme); setMode(mode);

const cv = $("#viz"), g = cv.getContext("2d");
const stars = Array.from({ length: 400 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));
let t0 = 0, beat = 0, bassAvg = 0;
function fakeData(t) { // gentle idle animation when nothing is playing
  for (let i = 0; i < freq.length; i++) freq[i] = Math.max(0, 60 + 40 * Math.sin(t / 700 + i / 18) - i / 9);
  for (let i = 0; i < wave.length; i++) wave[i] = 128 + 20 * Math.sin(t / 300 + i / 40);
}
function draw(t) {
  requestAnimationFrame(draw);
  const dpr = devicePixelRatio || 1, W = cv.clientWidth * dpr, H = cv.clientHeight * dpr;
  if (!W || !H) return;
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  if (!freq) { freq = new Uint8Array(1024); wave = new Uint8Array(2048); }
  const live = analyser && !audio.paused;
  if (live) { analyser.getByteFrequencyData(freq); analyser.getByteTimeDomainData(wave); } else fakeData(t);
  // beat detection on low frequencies
  let low = 0; for (let i = 0; i < 12; i++) low += freq[i]; low /= 12;
  bassAvg = bassAvg * 0.95 + low * 0.05;
  beat = Math.max(beat * 0.9, low > bassAvg * 1.15 && low > 120 ? 1 : 0);
  const [h1, h2] = THEMES[theme].h;
  const mini = cv.parentElement.id === "player", m = mini ? (mode === "wave" ? "wave" : "bars") : mode;
  $("#np").style.setProperty("--beat", beat.toFixed(2));
  detectVoice();
  if (mini) g.clearRect(0, 0, W, H);
  else { const trail = m === "galaxy" || m === "tunnel" ? 0.22 : 0.35; g.fillStyle = `rgba(5,5,13,${trail})`; g.fillRect(0, 0, W, H); }
  // beat glow
  if (!mini && beat > 0.05) { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 1.4); gr.addColorStop(0, `hsla(${h1},90%,55%,${beat * 0.18})`); gr.addColorStop(1, "transparent"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  const col = (p, a = 1, l = 60) => `hsla(${h1 + (h2 - h1) * p},90%,${l}%,${a})`;
  const cx = W / 2, cy = H / 2;

  if (m === "bars") {
    const n = 96, bw = W / n;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.pow(i / n, 1.7) * freq.length * 0.7);
      const v = freq[idx] / 255, bh = v * H * 0.85;
      const gr = g.createLinearGradient(0, H, 0, H - bh); gr.addColorStop(0, col(0)); gr.addColorStop(1, col(1, 1, 70));
      g.fillStyle = gr; g.fillRect(i * bw + 1, H - bh, bw - 2, bh);
      g.fillStyle = col(i / n, 0.25); g.fillRect(i * bw + 1, H - bh - 6 * dpr, bw - 2, 3 * dpr);
    }
  } else if (m === "wave") {
    for (let k = 0; k < 3; k++) {
      g.beginPath(); g.lineWidth = (4 - k) * dpr; g.strokeStyle = col(k / 2, 1 - k * 0.3, 65);
      g.shadowBlur = 20 * dpr; g.shadowColor = col(k / 2);
      for (let i = 0; i < wave.length; i += 4) {
        const x = i / wave.length * W, y = cy + (wave[i] - 128) / 128 * H * (0.45 - k * 0.1) * (1 + k * 0.2);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    g.shadowBlur = 0;
  } else if (m === "radial") {
    const n = 180, R = Math.min(W, H) * (0.22 + beat * 0.03);
    g.save(); g.translate(cx, cy); g.rotate(t / 6000);
    for (let i = 0; i < n; i++) {
      const v = freq[Math.floor(i / n * freq.length * 0.5)] / 255, a = i / n * Math.PI * 2, L = v * Math.min(W, H) * 0.3;
      g.strokeStyle = col(Math.abs(Math.sin(a)), 0.9); g.lineWidth = 3 * dpr;
      g.beginPath(); g.moveTo(Math.cos(a) * R, Math.sin(a) * R); g.lineTo(Math.cos(a) * (R + L), Math.sin(a) * (R + L)); g.stroke();
    }
    g.restore();
    g.beginPath(); g.arc(cx, cy, R * 0.85, 0, 7); g.fillStyle = col(0.5, 0.15 + beat * 0.3); g.fill();
    g.strokeStyle = col(1, 0.8); g.lineWidth = 2 * dpr; g.stroke();
  } else if (m === "galaxy") {
    const energy = freq.slice(0, 200).reduce((a, b) => a + b, 0) / 200 / 255;
    stars.forEach((s, i) => {
      s.z -= 0.003 + energy * 0.03 + beat * 0.02;
      if (s.z <= 0.01) { s.z = 1; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; }
      const x = cx + s.x / s.z * W * 0.3, y = cy + s.y / s.z * H * 0.3, r = (1 - s.z) * 3 * dpr * (1 + beat);
      g.fillStyle = col(i % 2, 1 - s.z * 0.6, 70); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    });
  } else if (m === "tunnel") {
    for (let k = 0; k < 14; k++) {
      const p = ((k / 14) + t / 4000) % 1, v = freq[k * 12] / 255;
      const s = Math.pow(p, 2) * Math.max(W, H) * (1 + v * 0.4);
      g.save(); g.translate(cx, cy); g.rotate(p * 2 + t / 3000);
      g.strokeStyle = col(p, 0.2 + p * 0.8); g.lineWidth = (1 + p * 6 + beat * 4) * dpr;
      g.beginPath(); for (let j = 0; j <= 6; j++) { const a = j / 6 * Math.PI * 2; g.lineTo(Math.cos(a) * s / 2, Math.sin(a) * s / 2); } g.stroke();
      g.restore();
    }
  }
}
requestAnimationFrame(draw);

/* ---------- Full screen, help, keys ---------- */
const fs = () => { const s = $(".stage"); document.fullscreenElement ? document.exitFullscreen() : (s.requestFullscreen || s.webkitRequestFullscreen || (() => {})).call(s); };
$("#fullscreenBtn").onclick = fs;
$(".stage").ondblclick = fs;
const help = v => $("#helpModal").classList.toggle("hidden", !v);
$("#helpBtn").onclick = () => help(true); $("#helpClose").onclick = () => help(false);
$("#helpModal").onclick = e => { if (e.target.id === "helpModal") help(false); };
addEventListener("keydown", e => {
  if (!$("#intro").classList.contains("hidden") || e.target.matches("input[type=text],input[type=search],select,textarea")) return;
  const k = e.key;
  if (k === " ") { e.preventDefault(); toggle(); }
  else if (k === "ArrowRight") { e.preventDefault(); e.shiftKey ? audio.currentTime += 10 : next(false); }
  else if (k === "ArrowLeft") { e.preventDefault(); e.shiftKey ? audio.currentTime -= 10 : prev(); }
  else if (k === "ArrowUp") { e.preventDefault(); vol.value = Math.min(100, +vol.value + 5); setVol(); }
  else if (k === "ArrowDown") { e.preventDefault(); vol.value = Math.max(0, +vol.value - 5); setVol(); }
  else if (/^[mM]$/.test(k)) $("#muteBtn").click();
  else if (/^[sS]$/.test(k)) $("#shuffleBtn").click();
  else if (/^[rR]$/.test(k)) $("#repeatBtn").click();
  else if (/^[vV]$/.test(k)) setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
  else if (/^[fF]$/.test(k)) fs();
  else if (/^[lL]$/.test(k)) Lyrics.toggle();
  else if (/^[kK]$/.test(k)) $("#karaokeBtn").click();
  else if (/^[hH?]$/.test(k)) help($("#helpModal").classList.contains("hidden"));
  else if (k === "Escape") help(false);
});

/* ---------- Leave intro ---------- */
function enterApp() {
  initAudio(); ctx.resume();
  $("#intro").classList.add("leaving");
  $("#app").classList.remove("hidden");
  setTimeout(() => { $("#intro").classList.add("hidden"); introRunning = false; }, 800);
}
$("#startBtn").onclick = enterApp;
addEventListener("keydown", e => { if (e.key === "Enter" && !$("#intro").classList.contains("hidden")) enterApp(); });

/* ---------- PWA ---------- */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
