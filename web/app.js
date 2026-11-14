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
audio.preload = "metadata";
let ctx, analyser, filters = [], bass, pan, master, freq, wave;
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
  let n = src; [...filters, bass, pan, master].forEach(f => { n.connect(f); n = f; });
  n.connect(analyser); analyser.connect(ctx.destination);
  freq = new Uint8Array(analyser.frequencyBinCount); wave = new Uint8Array(analyser.fftSize);
  applyEq(); bass.gain.value = +$("#bassBoost").value; setBalance();
}

/* ---------- Playlist ---------- */
let tracks = [], cur = -1, shuffle = store.get("shuffle", false), repeat = store.get("repeat", "off"); // off | all | one
const clean = n => n.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ");
function addFiles(files) {
  const list = [...files].filter(f => f.type.startsWith("audio/") || /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i.test(f.name));
  list.forEach(f => {
    const name = clean(f.name); let title = name, artist = "Unknown artist";
    const m = name.split(" - "); if (m.length > 1) { artist = m[0].trim(); title = m.slice(1).join(" - ").trim(); }
    tracks.push({ url: URL.createObjectURL(f), title, artist });
  });
  renderPlaylist();
  if (cur === -1 && tracks.length) load(0, true);
}
function renderPlaylist() {
  const ol = $("#playlist"); ol.innerHTML = "";
  tracks.forEach((t, i) => {
    const li = document.createElement("li"); if (i === cur) li.className = "current";
    li.innerHTML = `<span class="n"></span><button class="rm" title="Remove">✕</button>`;
    li.querySelector(".n").textContent = `${t.title} — ${t.artist}`;
    li.onclick = e => { if (e.target.classList.contains("rm")) return remove(i); load(i, true); };
    ol.appendChild(li);
  });
  $("#emptyHint").classList.toggle("hidden", tracks.length > 0);
}
function remove(i) {
  URL.revokeObjectURL(tracks[i].url); tracks.splice(i, 1);
  if (i === cur) { audio.pause(); audio.removeAttribute("src"); cur = -1; setMeta(); if (tracks.length) load(Math.min(i, tracks.length - 1), false); }
  else if (i < cur) cur--;
  renderPlaylist();
}
function load(i, play) {
  if (!tracks[i]) return;
  cur = i; audio.src = tracks[i].url; setMeta(); renderPlaylist();
  if (play) playNow();
}
function setMeta() {
  const t = tracks[cur];
  $("#trackTitle").textContent = t ? t.title : "No track loaded";
  $("#trackArtist").textContent = t ? t.artist : "Add songs to begin";
  document.title = t ? `${t.title} · ${C.name}` : C.name;
  if (t && "mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: C.name, artwork: [{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }] });
  }
}
function playNow() { initAudio(); ctx.resume(); audio.play().catch(() => {}); }
function toggle() { if (cur === -1) { if (tracks.length) load(0, true); else $("#fileInput").click(); return; } audio.paused ? playNow() : audio.pause(); }
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
$("#clearBtn").onclick = () => { audio.pause(); audio.removeAttribute("src"); tracks.forEach(t => URL.revokeObjectURL(t.url)); tracks = []; cur = -1; setMeta(); renderPlaylist(); };

// Drag and drop
let dragN = 0;
addEventListener("dragenter", e => { e.preventDefault(); dragN++; $("#dropOverlay").classList.remove("hidden"); });
addEventListener("dragleave", () => { if (--dragN <= 0) { dragN = 0; $("#dropOverlay").classList.add("hidden"); } });
addEventListener("dragover", e => e.preventDefault());
addEventListener("drop", e => { e.preventDefault(); dragN = 0; $("#dropOverlay").classList.add("hidden"); addFiles(e.dataTransfer.files); });

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
function setMode(m) { mode = m; store.set("mode", m); $$("#vizModes button").forEach(b => b.classList.toggle("active", b.dataset.mode === m)); }
$$("#vizModes button").forEach(b => b.onclick = () => setMode(b.dataset.mode));
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
  const trail = mode === "galaxy" || mode === "tunnel" ? 0.22 : 0.35;
  g.fillStyle = `rgba(5,5,13,${trail})`; g.fillRect(0, 0, W, H);
  // beat glow
  if (beat > 0.05) { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 1.4); gr.addColorStop(0, `hsla(${h1},90%,55%,${beat * 0.18})`); gr.addColorStop(1, "transparent"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  const col = (p, a = 1, l = 60) => `hsla(${h1 + (h2 - h1) * p},90%,${l}%,${a})`;
  const cx = W / 2, cy = H / 2;

  if (mode === "bars") {
    const n = 96, bw = W / n;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.pow(i / n, 1.7) * freq.length * 0.7);
      const v = freq[idx] / 255, bh = v * H * 0.85;
      const gr = g.createLinearGradient(0, H, 0, H - bh); gr.addColorStop(0, col(0)); gr.addColorStop(1, col(1, 1, 70));
      g.fillStyle = gr; g.fillRect(i * bw + 1, H - bh, bw - 2, bh);
      g.fillStyle = col(i / n, 0.25); g.fillRect(i * bw + 1, H - bh - 6 * dpr, bw - 2, 3 * dpr);
    }
  } else if (mode === "wave") {
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
  } else if (mode === "radial") {
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
  } else if (mode === "galaxy") {
    const energy = freq.slice(0, 200).reduce((a, b) => a + b, 0) / 200 / 255;
    stars.forEach((s, i) => {
      s.z -= 0.003 + energy * 0.03 + beat * 0.02;
      if (s.z <= 0.01) { s.z = 1; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; }
      const x = cx + s.x / s.z * W * 0.3, y = cy + s.y / s.z * H * 0.3, r = (1 - s.z) * 3 * dpr * (1 + beat);
      g.fillStyle = col(i % 2, 1 - s.z * 0.6, 70); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    });
  } else if (mode === "tunnel") {
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
  if (!$("#intro").classList.contains("hidden") || e.target.matches("input[type=text],select")) return;
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
