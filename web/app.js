(() => {
"use strict";
const C = window.APP_CONFIG || { name: "Pulsewave", credit: "Ryan Ocbina Barnal", version: "1.0.0", tagline: "" };
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const loadJs = src => new Promise((ok, bad) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
const store = {
  get(k, d) { try { const v = localStorage.getItem("pw." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("pw." + k, JSON.stringify(v)); } catch {} }
};


/* ---------- Icons (one consistent outline set, no emoji) ---------- */
const F = 'fill="currentColor" stroke="none"';
const ICONS = {
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  prev: '<path d="M18 6.5v11L9.5 12zM6 6v12"/>',
  next: '<path d="M6 6.5v11l8.5-5.5zM18 6v12"/>',
  shuffle: '<path d="M3 7h3.4c2 0 3.2 1 4.3 2.7l2.6 4.6c1 1.7 2.3 2.7 4.3 2.7H21M3 17h3.4c1.3 0 2.3-.4 3.1-1.2M14.5 8.2C15.3 7.4 16.2 7 17.6 7H21M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/>',
  repeat1: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/><path d="M11 10.6l1.4-.9v5"/>',
  vol: '<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6a8.5 8.5 0 0 1 0 12"/>',
  vollow: '<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/>',
  mute: '<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  lyrics: '<path d="M4 6.5h11M4 11h11M4 15.5h7"/><path d="M18.5 18.5V9.5l2.5-.8"/><circle cx="17" cy="18.5" r="1.6"/>',
  mic: '<rect x="9" y="2.8" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  home: '<path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-5.5h4V20"/>',
  sync: '<path d="M20 8.5A8 8 0 0 0 5.6 6.2L3.5 8.5"/><path d="M3.5 4v4.5H8"/><path d="M4 15.5a8 8 0 0 0 14.4 2.3l2.1-2.3"/><path d="M20.5 20v-4.5H16"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.9.8c0 1.7-2.5 2.1-2.5 3.6"/><circle cx="12" cy="17.1" r=".7" fill="currentColor"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.2 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  heart: '<path d="M12 20s-7.4-4.5-8.9-9.2C2 7.6 4.2 5 7 5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 2.8 0 5 2.6 3.9 5.8C19.4 15.5 12 20 12 20z"/>',
  heartFill: `<path ${F} d="M12 20s-7.4-4.5-8.9-9.2C2 7.6 4.2 5 7 5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 2.8 0 5 2.6 3.9 5.8C19.4 15.5 12 20 12 20z"/>`,
  more: `<circle ${F} cx="5.5" cy="12" r="1.6"/><circle ${F} cx="12" cy="12" r="1.6"/><circle ${F} cx="18.5" cy="12" r="1.6"/>`,
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="m14.5 5-7 7 7 7"/>',
  chev: '<path d="m9.5 5 7 7-7 7"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/>',
  library: '<path d="M4.5 4v16M9.5 4v16M14 4.6l5.6 15"/>',
  sliders: '<path d="M4 21v-6.5M4 10.5V3M12 21v-9M12 8V3M20 21v-4.5M20 12.5V3M1.5 14.5h5M9.5 8h5M17.5 16.5h5"/>',
  note: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  folderIn: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5 12 16l2.5-2.5"/>',
  headphones: '<path d="M3.5 17v-4.5a8.5 8.5 0 0 1 17 0V17"/><rect x="3" y="14.5" width="4" height="6" rx="1.5"/><rect x="17" y="14.5" width="4" height="6" rx="1.5"/>'
};
const ic = name => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
const setIc = (el, name) => { if (el && el.dataset.icn !== name) { el.dataset.icn = name; el.innerHTML = ic(name); } };
function applyIcons(root = document) { root.querySelectorAll("i[data-ic]").forEach(i => i.outerHTML = ic(i.dataset.ic)); }
applyIcons();

/* ---------- Look: appearance, accent colour, visual quality ---------- */
const PHONE = matchMedia("(max-width: 760px)");
const ACCENTS = {
  mono: { name: "Black & white", c: "#fafafa", c2: "#27272a", h: [0, 0], s: 0 },
  sunset: { name: "Sunset", c: "#f43f5e", c2: "#fbbf24", h: [345, 405], s: 90 },
  ocean: { name: "Ocean", c: "#3b82f6", c2: "#22d3ee", h: [220, 185], s: 90 },
  forest: { name: "Forest", c: "#10b981", c2: "#a3e635", h: [160, 85], s: 80 },
  grape: { name: "Grape", c: "#8b5cf6", c2: "#f0abfc", h: [265, 300], s: 85 },
  rose: { name: "Rose", c: "#ec4899", c2: "#fda4af", h: [325, 350], s: 85 },
};
const OLD_THEMES = ["grape", "sunset", "forest", "ocean", "rose"];   // earlier versions stored a number
if (store.get("lookV", 1) < 2) { store.set("accent", "mono"); store.set("intro", "minimal"); store.set("lookV", 2); }   // v1.8: thin black & white look
const LOOK = {
  mode: store.get("uiMode", "auto"),
  accent: store.get("accent", "mono"),
  quality: store.get("quality", "auto"),
  lite: false, off: false
};
const slowDevice = () => PHONE.matches || matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
function applyLook() {
  if (!ACCENTS[LOOK.accent]) LOOK.accent = "mono";
  const light = LOOK.mode === "light" || (LOOK.mode === "auto" && matchMedia("(prefers-color-scheme: light)").matches);
  const root = document.documentElement;
  root.dataset.mode = light ? "light" : "dark";
  root.dataset.accent = LOOK.accent;
  LOOK.off = LOOK.quality === "off";
  LOOK.lite = LOOK.quality === "lite" || (LOOK.quality === "auto" && slowDevice());
  document.body.classList.toggle("lite", LOOK.lite);
  document.body.classList.toggle("viz-off", LOOK.off);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = light ? "#ffffff" : "#000000";
  store.set("uiMode", LOOK.mode); store.set("accent", LOOK.accent); store.set("quality", LOOK.quality);
  document.querySelectorAll("#setMode button").forEach(b => b.classList.toggle("active", b.dataset.v === LOOK.mode));
  document.querySelectorAll("#setQuality button").forEach(b => b.classList.toggle("active", b.dataset.v === LOOK.quality));
  document.querySelectorAll("#themeDots button").forEach(b => b.classList.toggle("active", b.dataset.v === LOOK.accent));
  const n = document.getElementById("setQualityNote");
  if (n) n.textContent = LOOK.off ? "Visual effects are switched off. Lyrics and album art still show." : LOOK.lite ? "Lite: smoother and easier on the battery. Recommended for phones." : "Full: every effect at full resolution.";
}
matchMedia("(prefers-color-scheme: light)").addEventListener("change", applyLook);
applyLook();

/* ---------- Branding ---------- */
document.title = C.name;
$$("[data-appname]").forEach(e => e.textContent = C.name);
$$("[data-credit]").forEach(e => e.textContent = C.credit);
$$("[data-version]").forEach(e => e.textContent = C.version);
$$("[data-tagline]").forEach(e => e.textContent = C.tagline);
const it = $(".intro-title");
it.innerHTML = [...C.name].map((ch, i) => `<span style="animation-delay:${0.6 + i * 0.08}s">${ch === " " ? "&nbsp;" : ch}</span>`).join("");

/* ---------- Animated intro (5 styles, chosen in config.js) ---------- */
const INTROS = ["minimal", "rings", "equalizer", "wave", "glitch", "burst"];
const qs = new URLSearchParams(location.search).get("intro");
const savedIntro = store.get("intro", C.intro);
const introStyle = INTROS.includes(qs) ? qs : INTROS[+qs - 1] || (INTROS.includes(savedIntro) ? savedIntro : "minimal");
$("#intro").classList.add("intro-" + introStyle);
const icv = $("#introCanvas"), ix = icv.getContext("2d");
let introRunning = true, introT0 = null;
const R = Math.random;
const dots = Array.from({ length: 90 }, () => ({ a: R() * 6.28, r: R() * 600 + 40, s: R() * 0.004 + 0.001, z: R() * 2 + 0.5 }));
const parts = Array.from({ length: 260 }, () => { const a = R() * 6.28, d = 0.6 + R() * 0.8; return { a, d, s: 0.6 + R() * 0.8, h: R() * 50 - 10, z: 1 + R() * 2.5 }; });
const hue = x => `${(350 + x) % 360}`;
const INTRO_DRAW = {
  minimal(t, w, h, k, cx, cy) {   // one thin line draws a heartbeat under the logo, then fades
    const y = h * 0.88, span = Math.min(w * 0.7, 520 * k), x0 = cx - span / 2, p = Math.min(1, t / 1400);
    ix.lineWidth = 1.2 * k; ix.strokeStyle = `rgba(255,255,255,${0.75 - Math.max(0, (t - 2600) / 4000)})`; ix.lineJoin = ix.lineCap = "round";
    ix.beginPath(); ix.moveTo(x0, y);
    const pts = [[0.38, 0], [0.44, -38], [0.5, 34], [0.56, -14], [0.6, 0], [1, 0]];
    for (const [fx, dy] of pts) { const x = x0 + span * Math.min(fx, p); ix.lineTo(x, y + (fx <= p ? dy * k : 0)); if (fx > p) break; }
    ix.stroke();
  },
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
  const t = now - introT0, k = Math.min(devicePixelRatio || 1, LOOK.lite ? 1 : 1.5);
  const w = Math.round(innerWidth * k), h = Math.round(innerHeight * k);
  if (icv.width !== w || icv.height !== h) { icv.width = w; icv.height = h; }
  ix.clearRect(0, 0, w, h);
  INTRO_DRAW[introStyle](t, w, h, k, w / 2, h * 0.42);
  requestAnimationFrame(introLoop);
}
requestAnimationFrame(introLoop);

/* ---------- Audio graph ---------- */
const audio = new Audio();
audio.crossOrigin = "anonymous";   // lets the visualizer/equalizer work on songs streamed from the family server
audio.preload = "metadata";
if (store.get("karaokeV", 1) < 2) { store.set("karaoke", true); store.set("karaokeV", 2); }   // v1.9: karaoke on by default
let ctx, analyser, filters = [], bass, pan, master, freq, wave, kNodes = null, karaoke = store.get("karaoke", true);
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

// Keep the sound clean: when the EQ or bass boost raises some frequencies, lower the overall level
// by the same amount (headroom), then a limiter catches any remaining peaks. No more distortion.
let preamp = null, limiter = null, eqProbe = null;
function updateHeadroom() {
  if (!preamp) return;
  try {
    if (!eqProbe) {
      const oc = new OfflineAudioContext(1, 128, 44100), N = 240;
      eqProbe = { f: new Float32Array(N).map((_, i) => 20 * Math.pow(1000, i / (N - 1))), m: new Float32Array(N), ph: new Float32Array(N), tot: new Float32Array(N),
        nodes: [...BANDS.map((fr, i) => { const b = oc.createBiquadFilter(); b.type = i === 0 ? "lowshelf" : i === BANDS.length - 1 ? "highshelf" : "peaking"; b.frequency.value = fr; b.Q.value = 1.1; return b; }),
          Object.assign(oc.createBiquadFilter(), { type: "lowshelf" })] };
      eqProbe.nodes[BANDS.length].frequency.value = 90;
    }
    const P = eqProbe, gains = [...BANDS.map((_, i) => eqOn.checked ? eqGains[i] : 0), +$("#bassBoost").value];
    P.tot.fill(1);
    P.nodes.forEach((n, i) => { n.gain.value = gains[i]; n.getFrequencyResponse(P.f, P.m, P.ph); for (let k = 0; k < P.f.length; k++) P.tot[k] *= P.m[k]; });
    const boost = Math.max(0, 20 * Math.log10(Math.max(...P.tot)));
    preamp.gain.setTargetAtTime(Math.pow(10, -boost / 20), ctx.currentTime, 0.05);
    const h = $("#eqHeadroom"); if (h) h.textContent = boost > 0.5 ? `To keep the sound clean, the volume is lowered by ${boost.toFixed(1)} dB while these boosts are on.` : "";
  } catch {}
}
function initAudio() {
  if (ctx) return;
  // "playback" = a bigger sound buffer, meant for music; the default is tuned for games and crackles more easily
  const AC = window.AudioContext || window.webkitAudioContext;
  try { ctx = new AC({ latencyHint: "playback" }); } catch { ctx = new AC(); }
  // phones pause the sound engine for calls, other apps or the lock screen: resume as soon as we may
  ctx.onstatechange = () => { if (ctx.state !== "running" && ctx.state !== "closed" && !audio.paused) ctx.resume().catch(() => {}); };
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
  inv.gain.value = -1; diff.gain.value = 1; lowKeep.type = "lowpass"; lowKeep.frequency.value = 150;
  src.connect(dry); src.connect(split); split.connect(diff, 0); split.connect(inv, 1); inv.connect(diff);
  diff.connect(merge, 0, 0); diff.connect(merge, 0, 1); merge.connect(wet); src.connect(lowKeep); lowKeep.connect(wet);
  const midSum = ctx.createGain(); split.connect(midSum, 0); split.connect(midSum, 1);
  midAn = ctx.createAnalyser(); sideAn = ctx.createAnalyser(); midAn.fftSize = sideAn.fftSize = 1024; midAn.smoothingTimeConstant = sideAn.smoothingTimeConstant = 0.5;
  mBuf = new Float32Array(midAn.frequencyBinCount); sBuf = new Float32Array(sideAn.frequencyBinCount);
  midSum.connect(midAn); diff.connect(sideAn);
  dry.connect(mix); wet.connect(mix); kNodes = { dry, wet }; dry.gain.value = karaoke ? 0 : 1; wet.gain.value = karaoke ? 1 : 0;
  preamp = ctx.createGain();
  limiter = ctx.createDynamicsCompressor();
  Object.entries({ threshold: -1.5, knee: 0, ratio: 20, attack: 0.002, release: 0.2 }).forEach(([k, v]) => { limiter[k].value = v; });
  let n = mix; [preamp, ...filters, bass, pan, master, limiter].forEach(f => { n.connect(f); n = f; });
  n.connect(analyser); analyser.connect(ctx.destination);
  if (/[?&]debug/.test(location.search)) window.__pwPeak = () => { const d = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(d); return d.reduce((m, v) => Math.max(m, Math.abs(v)), 0); };
  freq = new Uint8Array(analyser.frequencyBinCount); wave = new Uint8Array(analyser.fftSize);
  applyEq(); bass.gain.value = +$("#bassBoost").value; setBalance(); updateHeadroom();
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
  let guestInfo = null, shares = {};
  const sq = () => encodeURIComponent(store.get("streamQ", "auto"));
  const stream = s => s.share ? `${s.shareUrl}/api/stream/${s.id}?s=${s.share}&q=${sq()}` : `${clean(cfg.url)}/api/stream/${s.id}?t=${tok()}&q=${sq()}`;
  // get the next song ready on the server so it starts without waiting
  function prepare(s) {
    if (!s || !s.remote || store.get("streamQ", "auto") === "original") return;
    const u = s.share ? `${s.shareUrl}/api/prepare/${s.id}?s=${s.share}&q=${sq()}` : `${clean(cfg.url)}/api/prepare/${s.id}?t=${tok()}&q=${sq()}`;
    fetch(u).catch(() => {});
  }
  const art = s => s.share ? `${s.shareUrl}/api/art/${s.id}?s=${s.share}` : `${clean(cfg.url)}/api/art/${s.id}?t=${tok()}`;
  const mapSong = (r, favs, plays) => ({ id: r.id, remote: true, title: r.title, artist: r.artist, album: r.album, duration: r.duration, year: r.year, genre: r.genre,
    fname: r.fname, size: r.size, added: r.added, art: r.hasArt ? "remote" : null, hasLrc: r.hasLrc, fav: favs.has(r.id), plays: plays[r.id] || 0 });

  async function loadLibrary() {
    const [lib, ud] = await Promise.all([call("library"), call("userdata")]);
    const favs = new Set(ud.favs || []), plays = ud.plays || {};
    songs = lib.songs.map(r => mapSong(r, favs, plays));
    try { info = await call("info"); cfg.name = info.name; } catch {}
    try { shares = Object.fromEntries((await call("shares")).shares.map(x => [x.playlistId, x.id])); } catch { shares = {}; }
    folders = ud.folders || [];
    playlists = [...(ud.playlists || []).filter(p => !p.ro),
      ...(ud.family || []).map(p => ({ ...p, id: "fam:" + p.owner + ":" + p.id, ro: true, shared: false, folderId: undefined }))];
    tracks = tracks.map(t => songs.find(s => s.id === t.id) || t);
    libFromServer = true;
    return lib;
  }
  async function reload() { await loadLibrary(); render(); }
  async function pushUser() {
    clearTimeout(saveT);
    try {
      await call("userdata", { method: "PUT", json: { favs: songs.filter(s => s.fav).map(s => s.id),
        plays: Object.fromEntries(songs.filter(s => s.plays).map(s => [s.id, s.plays])), playlists: playlists.filter(p => !p.ro), folders } });
    } catch (e) { toast("Couldn't save to the family server: " + e.message); }
  }
  function saveUser() { if (!on()) return; clearTimeout(saveT); saveT = setTimeout(pushUser, 700); }

  /* --- listen links: play a shared playlist on the website without an account --- */
  async function guest(id, url) {
    try {
      const r = await fetch(clean(url) + "/api/s/" + encodeURIComponent(id)), d = await r.json();
      if (!r.ok) { toast(d.error || "This listen link doesn't work any more"); return false; }
      guestInfo = { id, url: clean(url), name: d.name, owner: d.owner, server: d.server };
      songs = d.songs.map(x => ({ ...mapSong(x, new Set(), {}), share: id, shareUrl: clean(url) }));
      folders = [];
      playlists = [{ id: "share:" + id, name: d.name, owner: d.owner, ro: true, guest: true, songIds: songs.map(s => s.id), created: 0 }];
      view = { type: "playlist", id: "share:" + id };
      return true;
    } catch { toast("Couldn't reach the music server for this link"); return false; }
  }
  const siteBase = () => C.site || "https://pulsewave.ryanbarnal.com/";
  function linkFor(id) {
    const pub = clean((info && info.publicUrl) || cfg.url);
    return siteBase() + "?" + (clean(C.familyServer || "") === pub ? "" : "server=" + encodeURIComponent(pub) + "&") + "listen=" + id;
  }
  async function listenLink(p) {
    try {
      await pushUser();
      let id = shares[p.id];
      if (!id) { id = (await call("shares", { method: "POST", json: { playlistId: p.id } })).id; shares[p.id] = id; render(); }
      const link = linkFor(id);
      try { await navigator.clipboard.writeText(link); } catch {}
      const local = /^http:/.test(clean((info && info.publicUrl) || cfg.url));
      await ask("🔗 Listen link copied", link, "Done", local
        ? "Note: your server doesn't have a public https address yet, so this link only works at home. See the Family Server guide."
        : "Anyone with this link can play this playlist on the Pulsewave website. No account needed. Send it by message or email. Turn it off any time from the ⋯ menu.");
    } catch (e) { toast(e.message); }
  }
  async function stopLink(p) {
    const id = shares[p.id]; if (!id) return;
    try { await call("shares/" + id, { method: "DELETE" }); delete shares[p.id]; toast("Listen link turned off"); render(); } catch (e) { toast(e.message); }
  }
  function banner() {
    if (guestInfo) return `<div class="guest-banner">${ic("headphones")}<span><b>${esc(guestInfo.name)}</b> · shared by ${esc(guestInfo.owner)} from ${esc(guestInfo.server)}</span>
      <button class="btn" data-act="srv-signin">Sign in</button><button class="btn" data-act="guest-exit">My library</button></div>`;
    if (cfg && cfg.url && !cfg.token && cfg.use !== false) return `<button class="signin-card" data-act="srv-signin"><span class="big">${ic("home")}</span><span><b>Sign in to ${esc(cfg.name || "the family server")}</b><small>Family member? Sign in to hear the family's music and your playlists.</small></span><span class="chev">›</span></button>`;
    return "";
  }
  async function putLyrics(s) { try { await call("lyrics/" + s.id, { method: "PUT", body: s.lrc || "" }); s.hasLrc = !!s.lrc; } catch (e) { toast("Couldn't save lyrics to the server: " + e.message); } }
  async function lyrics(s) {
    if (s.share) { const r = await fetch(`${s.shareUrl}/api/lyrics/${s.id}?s=${s.share}`); if (!r.ok) throw new Error("none"); return r.text(); }
    return call("lyrics/" + s.id);
  }
  async function upload(files, folder) {
    if (!cfg.user || (!cfg.user.upload && !cfg.user.admin)) { toast("Ask the admin for permission to add music to the family library"); return []; }
    files = [...files];
    const base = n => n.replace(/\.[^.]+$/, "").toLowerCase();
    const lrcs = files.filter(f => /\.lrc$/i.test(f.name));
    const list = files.filter(f => /\.(mp3|m4a|aac|flac|ogg|oga|opus|wav|webm|aiff?|alac)$/i.test(f.name));
    const ids = [], problems = [];
    if (!list.length) { await ask("No songs to add", null, "OK", "Choose audio files such as MP3, M4A, FLAC, WAV or OGG."); return []; }
    for (const [i, f] of list.entries()) {
      toast(`Uploading ${i + 1} of ${list.length}: ${f.name}`);
      try {
        if (f.size > 1024 * 1024 * 95) throw new Error("too big to upload over the internet (over 95 MB). Copy it into the NAS music folder instead");
        const r = await call(`upload?name=${encodeURIComponent(f.name)}&folder=${encodeURIComponent(folder || "")}`, { method: "PUT", body: f });
        ids.push(r.id);
        const l = lrcs.find(x => base(x.name) === base(f.name));
        if (l) await call("lyrics/" + r.id, { method: "PUT", body: await l.text() }).catch(() => {});
      } catch (e) { problems.push(`${f.name}: ${e.message}`); }
    }
    if (ids.length) await reload();
    const added = ids.map(id => songs.find(s => s.id === id)).filter(Boolean);
    if (problems.length) await ask(added.length ? `Added ${plural(added.length, "song")}, but some failed` : "Couldn't add the music", null, "OK", problems.slice(0, 6).join("\n") + (problems.length > 6 ? `\n…and ${problems.length - 6} more` : ""));
    else if (added.length) toast(`Added ${plural(added.length, "song")} to the family library`);
    return added;
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
    const qp = new URLSearchParams(location.search), qServer = qp.get("server"), listen = qp.get("listen");
    if (qServer || listen) history.replaceState(null, "", location.pathname);
    if (qServer && /^https?:\/\//.test(qServer) && (!cfg || clean(cfg.url) !== clean(qServer))) { cfg = { url: clean(qServer), token: null, use: true }; store.set("server", cfg); }
    if (!cfg && C.familyServer) cfg = { url: clean(C.familyServer), token: null, use: true };   // the website knows the family server
    if (listen && cfg && await guest(listen, cfg.url)) { badge(); return true; }
    badge();
    if (!cfg || cfg.use === false) return false;
    if (!cfg.token) {
      if (cfg.same || qServer) setTimeout(open, 50);
      else call("info", {}, { url: cfg.url }).then(i => { cfg.name = i.name; render(); }).catch(() => {});
      return false;
    }
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
    B().innerHTML = `<div class="srv-me"><span class="avatar">${esc(u.name[0].toUpperCase())}</span>
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
      $("#srvUsers").innerHTML = adminUsers.map(x => `<li data-u="${esc(x.name)}"><span class="avatar">${esc(x.name[0].toUpperCase())}</span>
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

  return { boot, on, stream, art, prepare, saveUser, banner, listenLink, stopLink, hasLink: p => !!shares[p.id], isGuest: () => !!guestInfo, putLyrics, lyrics, upload, removeSong, reload, open, user: () => cfg && cfg.user, name: () => cfg && cfg.name };
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
  if (s.share) return Promise.resolve();
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
let shufPlayed = new Set(), playedStack = [];
function playList(list, i = 0, shuf = false) {
  if (!list.length) return;
  tracks = list.slice(); shufPlayed = new Set(); playedStack = [];
  if (shuf) { shuffle = true; syncModes(); i = Math.floor(Math.random() * tracks.length); }
  load(i, true);
}
function load(i, play) {
  if (!tracks[i]) return;
  cur = i; shufPlayed.add(tracks[i]); audio.preload = tracks[i].remote ? "auto" : "metadata"; audio.src = srcUrl(tracks[i]);
  if (tracks[i].remote) setTimeout(() => Srv.prepare(tracks[i + 1] || (repeat === "all" ? tracks[0] : null)), 1500); setMeta(); if (view.type === "queue") render(); else markPlaying();
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
  updateMini();
  document.title = t ? `${t.title} · ${C.name}` : C.name;
  if (t && "mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album || C.name,
      artwork: [t.art ? { src: artUrl(t) } : { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }] });
  }
}
function playNow() {
  initAudio(); ctx.resume().catch(() => {});
  audio.play().catch(e => { if (e && e.name === "NotAllowedError") { setIc($("#playBtn"), "play"); setIc($("#miniPlay"), "play"); toast("Tap play to continue"); } });
}
function toggle() {
  if (cur === -1) { if (tracks.length) load(0, true); else if (songs.length) playList(songs); else $("#fileInput").click(); return; }
  audio.paused ? playNow() : audio.pause();
}
function pickShuffle() {
  const left = []; tracks.forEach((t, i) => { if (i !== cur && !shufPlayed.has(t)) left.push(i); });
  return left.length ? left[Math.floor(Math.random() * left.length)] : -1;
}
// When a list ends: keep playing other songs from the library (Settings → "Keep playing")
function keepPlaying() {
  if (!store.get("autoplay", true)) return false;
  const inQueue = new Set(tracks), pool = songs.filter(s => !inQueue.has(s));
  if (!pool.length) return false;
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  tracks.push(...pool.slice(0, 25));
  toast("Keep playing: more songs from your library");
  if (view.type === "queue") render();
  load(cur + 1, true);
  return true;
}
function endOfList() { audio.pause(); audio.currentTime = 0; toast("That's the end of the list"); }
function next(auto, skip) {
  if (!tracks.length) return;
  if (auto && !skip && repeat === "one") { audio.currentTime = 0; return playNow(); }
  let n;
  const pinned = tracks[cur + 1] && tracks[cur + 1]._next;     // "Play next" wins, even in shuffle
  if (pinned) { delete tracks[cur + 1]._next; n = cur + 1; }
  else if (shuffle && tracks.length > 1) {
    n = pickShuffle();
    if (n < 0) {                                              // every song has played once
      if (repeat === "all" || !auto) { shufPlayed = new Set([tracks[cur]]); n = pickShuffle(); }
      else return keepPlaying() || endOfList();
    }
  } else n = cur + 1;
  if (n >= tracks.length) { if (auto && repeat === "off") return keepPlaying() || endOfList(); n = 0; }
  if (tracks[cur]) playedStack.push(tracks[cur]);
  load(n, true);
}
function prev() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  if (shuffle && playedStack.length) { const s = playedStack.pop(), i = tracks.indexOf(s); if (i >= 0) return load(i, true); }
  load(cur <= 0 ? tracks.length - 1 : cur - 1, true);
}

/* --- playlists --- */
const SMART = [
  { id: "_fav", name: "Favorite Songs", smart: true, icon: "heartFill", list: () => songs.filter(s => s.fav) },
  { id: "_recent", name: "Recently Added", smart: true, icon: "clock", list: () => [...songs].sort((a, b) => b.added - a.added).slice(0, 50) }
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
function toggleFav(s) {
  s.fav = !s.fav; s.mtime = Date.now(); saveSong(s); toast(s.fav ? "Added to Favorite Songs" : "Removed from Favorite Songs");
  if (view.type === "playlist" && view.id === "_fav") return render();
  V.querySelectorAll(".song").forEach(r => { if (rowCtx && rowCtx.list[+r.dataset.i] === s) { const b = r.querySelector(".fav"); if (b) { b.classList.toggle("on", s.fav); b.innerHTML = ic(s.fav ? "heartFill" : "heart"); } } });
}
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
    { label: "▶  Play next", fn: () => { if (cur === -1) return playList([s]); s._next = true; tracks.splice(cur + 1, 0, s); toast("Playing next"); render(); } },
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
  if (arts.length >= 4) return `<div class="${cls} mosaic">${arts.slice(0, 4).map(u => `<img src="${u}" alt="" loading="lazy" decoding="async">`).join("")}</div>`;
  if (arts.length) return `<div class="${cls}"><img src="${arts[0]}" alt="" loading="lazy" decoding="async"></div>`;
  const h = hueOf(p.id || p.name);
  return `<div class="${cls} blank">${ic(p.icon || "note")}</div>`;
}
const card = (p, act, extra = "") => { const l = listOf(p); return `<button class="card" data-act="${act}" data-id="${esc(p.id)}">${cover(l, p)}<div class="cn">${esc(p.name)}</div><div class="cs">${extra || (p.ro ? "👪 " + esc(p.owner) + " · " : (p.shared ? "👪 Shared · " : "") + (Srv.hasLink(p) ? "🔗 " : "")) + plural(l.length, "song")}</div></button>`; };
const head = (title, list, extra = "") => `<div class="pl-btns-row"><span class="muted">${plural(list.length, "song")}${list.length ? ", " + mins(list.reduce((a, s) => a + (s.duration || 0), 0)) : ""}</span>
  ${list.length ? `<button class="btn primary" data-act="play-all">${ic("play")}Play</button><button class="btn" data-act="shuffle-all">${ic("shuffle")}Shuffle</button>` : ""}${extra}</div>`;
const CHUNK = 60;
function rowHtml(s, i, c) {
  const playing = c.queue ? i === cur : tracks[cur] === s, drag = c.pl && editable(c.pl);
  const picked = c.pick && c.pick.songIds.includes(s.id);
  return `<li class="song${playing ? " current" : ""}${c.queue && i < cur ? " played" : ""}" data-i="${i}"${drag ? ' draggable="true"' : ""}>
      ${drag ? '<span class="grip" title="Drag to reorder">⋮⋮</span>' : ""}
      <span class="thumb"><img src="${artUrl(s)}" alt="" loading="lazy" decoding="async" width="42" height="42">${playing ? '<span class="eqi"><i></i><i></i><i></i></span>' : ""}</span>
      <span class="sm"><span class="st">${esc(s.title)}</span><span class="ss">${esc(s.artist)}${s.album ? " · " + esc(s.album) : ""}</span></span>
      <span class="sd">${fmtLen(s.duration)}</span>
      ${c.pick ? `<button class="pick${picked ? " on" : ""}" data-act="pick" aria-label="Add">${ic(picked ? "check" : "plus")}</button>` :
        `<button class="fav${s.fav ? " on" : ""}" data-act="fav" title="Favorite" aria-label="Favorite">${ic(s.fav ? "heartFill" : "heart")}</button><button class="more" data-act="more" title="More" aria-label="More">${ic("more")}</button>`}
    </li>`;
}
function songsHtml(list, c = {}) {
  rowCtx = { list, ...c, shown: Math.min(list.length, Math.max(CHUNK, view.shown || 0)) };
  if (!list.length) return "";
  let h = "";
  for (let i = 0; i < rowCtx.shown; i++) h += rowHtml(list[i], i, rowCtx);
  return `<ol class="songs">${h}</ol>${rowCtx.shown < list.length ? '<div class="more-rows" id="moreRows"></div>' : ""}`;
}
// add the next rows when the end of the list scrolls into view
const moreObs = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) moreRows(); }, { rootMargin: "600px" });
function moreRows() {
  if (!rowCtx || rowCtx.shown >= rowCtx.list.length) return;
  const ol = V.querySelector(".songs"); if (!ol) return;
  const end = Math.min(rowCtx.list.length, rowCtx.shown + CHUNK); let h = "";
  for (let i = rowCtx.shown; i < end; i++) h += rowHtml(rowCtx.list[i], i, rowCtx);
  ol.insertAdjacentHTML("beforeend", h); rowCtx.shown = view.shown = end;
  if (end >= rowCtx.list.length) { const m = $("#moreRows"); if (m) { moreObs.unobserve(m); m.remove(); } }
}
// mark the playing song without rebuilding the list
function markPlaying() {
  if (!rowCtx) return;
  V.querySelectorAll(".song").forEach(r => {
    const i = +r.dataset.i, on = rowCtx.queue ? i === cur : rowCtx.list[i] === tracks[cur];
    if (r.classList.contains("current") === on) return;
    r.classList.toggle("current", on);
    const th = r.querySelector(".thumb"), q = th && th.querySelector(".eqi");
    if (on && !q && th) th.insertAdjacentHTML("beforeend", '<span class="eqi"><i></i><i></i><i></i></span>'); else if (!on && q) q.remove();
  });
}
let curList = [];
const folderBg = () => "";
const folderCard = f => `<button class="card" data-act="open-folder" data-id="${esc(f.id)}"><div class="cover blank folder-cov">${ic("folder")}</div><div class="cn">${esc(f.name)}</div><div class="cs">Folder · ${plural(inFolder(f).length, "playlist")}</div></button>`;
const newTiles = inside => `<button class="card" data-act="new-pl"><div class="cover blank plus">${ic("plus")}</div><div class="cn">New Playlist</div><div class="cs">&nbsp;</div></button>` +
  (inside ? "" : `<button class="card" data-act="new-folder"><div class="cover blank plus">${ic("folder")}</div><div class="cn">New Folder</div><div class="cs">Group playlists</div></button>`) +
  `<button class="card" data-act="import-folder" title="Make a playlist from a folder of music on this device"><div class="cover blank plus">${ic("folderIn")}</div><div class="cn">Import Folder</div><div class="cs">Folder → playlist</div></button>`;
const scroller = () => PHONE.matches ? document.scrollingElement : LP;
function go(v) { view = v; if (["playlists", "songs", "artists", "albums", "queue"].includes(v.type)) store.set("libView", v.type); query = ""; $("#libSearch").value = ""; closeMenu(); render(); scroller().scrollTop = 0; }
function render() {
  if (!libReady) return;
  const t = view.type, sc = scroller().scrollTop;
  const oldMore = $("#moreRows"); if (oldMore) moreObs.unobserve(oldMore);
  const navOf = { playlist: "playlists", pick: "playlists", folder: "playlists", artist: "artists", album: "albums" };
  $$("#libNav button").forEach(b => b.classList.toggle("active", !query && b.dataset.view === (navOf[t] || t)));
  $("#emptyHint").classList.toggle("hidden", songs.length > 0 || tracks.length > 0);
  rowCtx = null; curList = [];
  let h = "";
  const back = (to, label) => `<button class="back" data-act="go" data-to="${to}">${ic("back")}${label}</button>`;
  const q = query.toLowerCase(), match = s => !q || (s.title + " " + s.artist + " " + s.album).toLowerCase().includes(q);

  if (!songs.length && t !== "queue" && !query && !Srv.isGuest()) {
    h = `<div class="lib-empty"><div class="big-ico">${ic("note")}</div><h3>Your library is empty</h3><p class="muted">Add songs from your device. They stay saved here for next time.</p><button class="btn primary" data-act="add-music">${ic("plus")}Add music</button></div>`;
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
    h = back("playlists", "Playlists") + `<div class="pl-head"><div class="cover big blank folder-cov">${ic("folder")}</div><div class="pl-info"><h2>${esc(f.name)}</h2>
      <p class="muted">${plural(pls.length, "playlist")}</p><div class="pl-tools"><button class="btn icon" data-act="folder-more" title="More">⋯</button></div></div></div>` +
      head(f.name, curList) + `<div class="grid">${newTiles(true)}${pls.map(p => card(p, "open-pl")).join("")}</div>` +
      (pls.length ? "" : `<p class="muted pad">This folder is empty. Make a playlist here, or open any playlist and use <b>⋯ → Move to folder</b>.</p>`);
  } else if (t === "playlist") {
    const p = getPl(view.id); if (!p) { view = { type: "playlists" }; return render(); }
    curList = listOf(p);
    const pf = p.folderId && getFolder(p.folderId);
    h = (pf ? `<button class="back" data-act="open-folder" data-id="${esc(pf.id)}">‹ ${esc(pf.name)}</button>` : back("playlists", "Playlists")) + `<div class="pl-head">${cover(curList, p, true)}<div class="pl-info"><h2>${esc(p.name)}</h2>
      ${p.ro ? `<p class="muted">👪 Shared by ${esc(p.owner)}</p>${p.guest ? "" : `<div class="pl-tools"><button class="btn" data-act="pl-copy">Copy to my playlists</button></div>`}` : p.smart ? "" : `<div class="pl-tools"><button class="btn" data-act="add-songs">＋ Add songs</button><button class="btn icon" data-act="pl-more" title="More">⋯</button></div>`}</div></div>` +
      head(p.name, curList) + (curList.length ? songsHtml(curList, { pl: p }) :
      `<p class="muted pad">${p.smart ? (p.id === "_fav" ? "Tap the heart on any song to add it here." : "Songs you add will show up here.") : "This playlist is empty. Tap <b>Add songs</b> to choose music."}</p>`);
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
      return `<li><button data-act="open-artist" data-name="${esc(n)}"><span class="avatar">${a ? `<img src="${artUrl(a)}" alt="" loading="lazy" decoding="async">` : esc(n[0] || "?")}</span><span class="ln">${esc(n)}</span><span class="muted">${plural(l.length, "song")}</span><span class="chev">${ic("chev")}</span></button></li>`; }).join("")}</ul>`;
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
  if (t !== "pick") h = Srv.banner() + h;
  if (Srv.on() && t !== "pick") h = `<div class="src-badge"><b>${esc(Srv.name() || "Family server")}</b> · ${esc((Srv.user() || {}).name || "")}</div>` + h;
  V.innerHTML = h;
  const mr = $("#moreRows"); if (mr) moreObs.observe(mr);
  const so = $("#libSort"); if (so) { so.value = store.get("sort", "title"); so.onchange = () => { store.set("sort", so.value); render(); }; }
  scroller().scrollTop = sc;
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
  else if (act === "srv-signin") Srv.open();
  else if (act === "guest-exit") location.href = location.pathname;
  else if (act === "pl-copy" && p) { const np = { id: uid(), name: p.name, songIds: [...p.songIds], created: Date.now() }; playlists.push(np); savePl(np); toast(`Copied “${p.name}” to your playlists`); go({ type: "playlist", id: np.id }); }
  else if (act === "import-folder") $("#folderInput").click();
  else if (act === "clear-queue") { tracks = cur >= 0 ? [tracks[cur]] : []; cur = tracks.length ? 0 : -1; render(); }
  else if (act === "pl-more" && p) { e.stopPropagation(); menu(a, [{ label: "＋ Add songs", fn: () => go({ type: "pick", id: p.id }) }, { label: "✎  Rename", fn: () => renamePl(p) }, { label: "📁 Move to folder…", fn: () => folderMenu(a, p) }, Srv.on() && { label: Srv.hasLink(p) ? "🔗 Copy listen link" : "🔗 Make a listen link (no account needed)", fn: () => Srv.listenLink(p) },
      Srv.on() && Srv.hasLink(p) && { label: "🔗 Turn off listen link", fn: () => Srv.stopLink(p) },
      Srv.on() && { label: p.shared ? "👪 Stop sharing with family" : "👪 Share with family", fn: () => { p.shared = !p.shared; savePl(p); toast(p.shared ? "Your family can now see and play this playlist" : "This playlist is private again"); render(); } }, "-", { label: "Delete playlist", danger: true, fn: () => deletePl(p) }]); }
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
audio.onplay = () => { setIc($("#playBtn"), "pause"); setIc($("#miniPlay"), "pause"); };
audio.onpause = () => { setIc($("#playBtn"), "play"); setIc($("#miniPlay"), "play"); };
audio.onended = () => next(true);
let errTries = 0;
audio.addEventListener("error", () => {
  const t = tracks[cur]; if (!t || !audio.getAttribute("src")) return;
  if (errTries++ < 1) {                                   // one retry (e.g. a dropped connection)
    const at = audio.currentTime || 0;
    setTimeout(() => { if (tracks[cur] !== t) return; audio.src = srcUrl(t); audio.addEventListener("loadedmetadata", () => { if (at) audio.currentTime = at; }, { once: true }); playNow(); }, 1200);
    return;
  }
  errTries = 0; toast(`Couldn't play “${t.title}”, so it was skipped`); next(true, true);
});
audio.addEventListener("playing", () => { errTries = 0; });
// Watchdog: if the music should be playing but time stands still, wake the sound engine, then reconnect
let lastPos = -1, stuckFor = 0;
setInterval(() => {
  if (audio.paused || audio.ended || !tracks[cur]) { stuckFor = 0; return; }
  if (audio.currentTime !== lastPos) { lastPos = audio.currentTime; stuckFor = 0; return; }
  stuckFor += 3;
  if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
  if (stuckFor >= 15) {
    stuckFor = 0; const t = tracks[cur], at = audio.currentTime;
    toast("Reconnecting…"); audio.src = srcUrl(t);
    audio.addEventListener("loadedmetadata", () => { if (at) audio.currentTime = at; }, { once: true }); playNow();
  }
}, 3000);
document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx && ctx.state !== "running" && !audio.paused) ctx.resume().catch(() => {}); });
let waitT = 0, stalls = [];
audio.addEventListener("waiting", () => {
  clearTimeout(waitT);
  waitT = setTimeout(() => {
    stalls = stalls.filter(t => Date.now() - t < 120000); stalls.push(Date.now());
    const t = tracks[cur];
    toast(t && t.remote ? (stalls.length >= 3 ? "The connection to the family server is slow, so the music keeps pausing to load. Try Wi-Fi." : "Loading… the connection is slow") : "Loading…");
  }, 900);
});
audio.addEventListener("playing", () => clearTimeout(waitT));
audio.onloadedmetadata = () => $("#durTime").textContent = fmt(audio.duration);
let seeking = false;
audio.ontimeupdate = () => {
  if (!seeking && audio.duration) $("#seek").value = audio.currentTime / audio.duration * 1000;
  $("#curTime").textContent = fmt(audio.currentTime);
  if (audio.duration) $("#miniBar").style.width = (audio.currentTime / audio.duration * 100).toFixed(1) + "%";
};
$("#seek").oninput = () => { seeking = true; $("#curTime").textContent = fmt($("#seek").value / 1000 * (audio.duration || 0)); };
$("#seek").onchange = () => { if (audio.duration) audio.currentTime = $("#seek").value / 1000 * audio.duration; seeking = false; };
const vol = $("#volume"); vol.value = store.get("vol", 80);
const setVol = () => { audio.volume = vol.value / 100; audio.muted = false; setIc($("#muteBtn"), vol.value == 0 ? "mute" : vol.value < 50 ? "vollow" : "vol"); store.set("vol", +vol.value); };
vol.oninput = setVol; setVol();
$("#muteBtn").onclick = () => { audio.muted = !audio.muted; setIc($("#muteBtn"), audio.muted ? "mute" : "vol"); };
const syncModes = () => {
  $("#shuffleBtn").classList.toggle("on", shuffle);
  $("#repeatBtn").classList.toggle("on", repeat !== "off");
  setIc($("#repeatBtn"), repeat === "one" ? "repeat1" : "repeat");
  $("#repeatBtn").title = `Repeat: ${repeat} (R)`;
  store.set("shuffle", shuffle); store.set("repeat", repeat);
};
$("#shuffleBtn").onclick = () => { shuffle = !shuffle; if (shuffle) shufPlayed = new Set(tracks[cur] ? [tracks[cur]] : []); syncModes(); };
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
$("#bassBoost").oninput = e => { if (bass) bass.gain.value = +e.target.value; store.set("bass", +e.target.value); updateHeadroom(); };
$("#balance").oninput = setBalance;
function setBalance() { if (pan && pan.pan) pan.pan.value = $("#balance").value / 100; }
function applyEq() {
  $$(".band").forEach((d, i) => { d.querySelector("input").value = eqGains[i]; d.querySelector(".val").textContent = (eqGains[i] > 0 ? "+" : "") + eqGains[i]; });
  $("#panel-eq").classList.toggle("eq-off", !eqOn.checked);
  filters.forEach((f, i) => f.gain.setTargetAtTime(eqOn.checked ? eqGains[i] : 0, ctx.currentTime, 0.02));
  store.set("eq", eqGains); store.set("preset", sel.value); store.set("eqOn", eqOn.checked);
  updateHeadroom();
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

  // A soft colour wash from the cover: shrink it to 12×12 once, let the browser stretch it smoothly (no costly blur)
  let bgFor = "";
  function softBg(url) {
    const el = $("#npBg"); if (url === bgFor) return; bgFor = url;
    if (url === "logo.svg") { el.style.backgroundImage = "none"; return; }
    const im = new Image(); im.crossOrigin = "anonymous"; im.decoding = "async";
    im.onload = () => { if (bgFor !== url) return; try { const c = document.createElement("canvas"); c.width = c.height = 12; c.getContext("2d").drawImage(im, 0, 0, 12, 12); el.style.backgroundImage = `url(${c.toDataURL()})`; } catch { el.style.backgroundImage = `url("${url}")`; } };
    im.src = url;
  }
  function paint() {
    const t = track, a = t && t.art ? artUrl(t) : remoteArt || "logo.svg";
    $("#npArt").src = a; $("#npMiniArt").src = a;
    softBg(a);
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
    if (!show || !stageShown()) return;
    NP.frame(lines, synced, audio.currentTime + offset);
    if (!lines.length || !audio.duration) return;
    const ct = audio.currentTime + offset;
    let i;
    if (synced) { i = -1; for (let j = 0; j < lines.length && lines[j].t <= ct; j++) i = j; }
    else i = Math.min(lines.length - 1, Math.floor((ct / audio.duration) * lines.length * 1.05));
    const bq = Math.round(Math.min(1, beat || 0) * 20) / 20;
    if (bq !== beatSet && !LOOK.lite) { beatSet = bq; el.style.setProperty("--beat", bq); }
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
    if (peer) return;
    if (typeof Peer === "undefined") { loadJs("vendor/peerjs.min.js").then(start, () => setState("Sync couldn't load. Check your internet connection.")); return; }
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
    if (typeof qrcode === "undefined") { loadJs("vendor/qrcode.js").then(showCode, () => {}); return; }
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
let mode = store.get("mode", "bars");
const MODES = ["bars", "wave", "radial", "galaxy", "tunnel"];
function setMode(m) { mode = m; store.set("mode", m); $$("#vizModes [data-mode]").forEach(b => b.classList.toggle("active", b.dataset.mode === m)); }
$$("#vizModes [data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
setMode(mode);

const cv = $("#viz"), g = cv.getContext("2d");
const stars = Array.from({ length: 400 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));
let t0 = 0, beat = 0, bassAvg = 0, lastDraw = 0, beatSet = -1;
function fakeData(t) { // gentle idle animation when nothing is playing
  for (let i = 0; i < freq.length; i++) freq[i] = Math.max(0, 60 + 40 * Math.sin(t / 700 + i / 18) - i / 9);
  for (let i = 0; i < wave.length; i++) wave[i] = 128 + 20 * Math.sin(t / 300 + i / 40);
}
function draw(t) {
  requestAnimationFrame(draw);
  if (!freq) { freq = new Uint8Array(1024); wave = new Uint8Array(2048); }
  const live = analyser && !audio.paused;
  if (live) { analyser.getByteFrequencyData(freq); analyser.getByteTimeDomainData(wave); } else fakeData(t);
  // beat detection on low frequencies
  let low = 0; for (let i = 0; i < 12; i++) low += freq[i]; low /= 12;
  bassAvg = bassAvg * 0.95 + low * 0.05;
  beat = Math.max(beat * 0.9, low > bassAvg * 1.15 && low > 120 ? 1 : 0);
  detectVoice();
  // only draw when someone can see it; Lite = 30 fps at normal resolution
  if (LOOK.off || !stageShown()) return;
  if (LOOK.lite && t - lastDraw < 32) return;
  lastDraw = t;
  const dpr = Math.min(devicePixelRatio || 1, LOOK.lite ? 1 : 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
  if (!W || !H) return;
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const A = ACCENTS[LOOK.accent] || ACCENTS.mono, [h1, h2] = A.h, sat = A.s;
  const mini = cv.parentElement.id === "player", m = mini ? (mode === "wave" ? "wave" : "bars") : mode;
  if (mini) g.clearRect(0, 0, W, H);
  else { const trail = m === "galaxy" || m === "tunnel" ? 0.22 : 0.35; g.fillStyle = `rgba(5,5,13,${trail})`; g.fillRect(0, 0, W, H); }
  // beat glow
  if (!mini && beat > 0.05) { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 1.4); gr.addColorStop(0, `hsla(${h1},${sat}%,55%,${beat * 0.18})`); gr.addColorStop(1, "transparent"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  const col = (p, a = 1, l = 60) => `hsla(${h1 + (h2 - h1) * p},${sat}%,${l}%,${a})`;
  const cx = W / 2, cy = H / 2;

  if (m === "bars") {
    const n = 96, bw = W / n;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.pow(i / n, 1.7) * freq.length * 0.7);
      const v = freq[idx] / 255, bh = v * H * 0.85;
      const gr = g.createLinearGradient(0, H, 0, H - bh); gr.addColorStop(0, col(0)); gr.addColorStop(1, col(1, 1, 70));
      const lw = Math.max(1, bw * 0.28);
      g.fillStyle = gr; g.fillRect(i * bw + (bw - lw) / 2, H - bh, lw, bh);
      g.fillStyle = col(i / n, 0.5); g.fillRect(i * bw + (bw - lw) / 2, H - bh - 5 * dpr, lw, 1.5 * dpr);
    }
  } else if (m === "wave") {
    for (let k = 0; k < 3; k++) {
      g.beginPath(); g.lineWidth = (1.6 - k * 0.4) * dpr; g.strokeStyle = col(k / 2, 1 - k * 0.3, 65);
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
      g.strokeStyle = col(Math.abs(Math.sin(a)), 0.9); g.lineWidth = 1.2 * dpr;
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
      g.strokeStyle = col(p, 0.2 + p * 0.8); g.lineWidth = (0.6 + p * 1.6 + beat) * dpr;
      g.beginPath(); for (let j = 0; j <= 6; j++) { const a = j / 6 * Math.PI * 2; g.lineTo(Math.cos(a) * s / 2, Math.sin(a) * s / 2); } g.stroke();
      g.restore();
    }
  }
}
requestAnimationFrame(draw);

/* ---------- Full screen, help, keys ---------- */
const fs = () => { const s = $(".stage"); document.fullscreenElement ? document.exitFullscreen() : (s.requestFullscreen || s.webkitRequestFullscreen || (() => {})).call(s); };
$("#fullscreenBtn").onclick = fs;
$(".stage").ondblclick = e => { if (!e.target.closest("button, .stage-btns, .viz-modes, .tt-panel")) fs(); };
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


/* ---------- Settings window ---------- */
(() => {
  const dots = $("#themeDots");
  dots.innerHTML = Object.entries(ACCENTS).map(([k, a]) => `<button data-v="${k}" title="${a.name}" aria-label="${a.name}" style="background:linear-gradient(135deg,${a.c},${a.c2})"></button>`).join("");
  dots.onclick = e => { const b = e.target.closest("button"); if (b) { LOOK.accent = b.dataset.v; applyLook(); } };
  $("#setMode").onclick = e => { const b = e.target.closest("button"); if (b) { LOOK.mode = b.dataset.v; applyLook(); } };
  $("#setQuality").onclick = e => { const b = e.target.closest("button"); if (b) { LOOK.quality = b.dataset.v; applyLook(); } };
  const ap = $("#setAutoplay"); ap.checked = store.get("autoplay", true); ap.onchange = () => store.set("autoplay", ap.checked);
  const sq = $("#setStream"), markSq = () => sq.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.v === store.get("streamQ", "auto")));
  sq.onclick = e => { const b = e.target.closest("button"); if (b) { store.set("streamQ", b.dataset.v); markSq(); toast("Applies from the next song"); } };
  markSq();
  const intro = $("#setIntro"), curIntro = () => store.get("intro", C.intro || "rings");
  const markIntro = () => intro.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.v === curIntro()));
  intro.onclick = e => { const b = e.target.closest("button"); if (b) { store.set("intro", b.dataset.v); markIntro(); toast("You'll see this intro next time you open Pulsewave"); } };
  markIntro(); applyLook();
  const m = $("#setModal");
  $("#setBtn").onclick = () => m.classList.remove("hidden");
  $("#setClose").onclick = () => m.classList.add("hidden");
  m.onclick = e => { if (e.target === m) m.classList.add("hidden"); };
})();

/* ---------- Phone: one screen at a time + mini player ---------- */
let uiSection = "np";
const stageShown = () => !(PHONE.matches && uiSection !== "np") && !document.hidden;
function setSection(m) {
  uiSection = m; document.body.dataset.m = m;
  $$("#mnav button").forEach(b => b.classList.toggle("active", b.dataset.m === m));
  const tab = { library: "library", eq: "eq", lyrics: "lyrics" }[m];
  if (tab) { const b = document.querySelector(`.tabs [data-tab="${tab}"]`); if (b) b.click(); }
  scrollTo(0, 0);
}
$("#mnav").onclick = e => { const b = e.target.closest("[data-m]"); if (b) setSection(b.dataset.m); };
$("#miniOpen").onclick = () => setSection("np");
$("#miniPlay").onclick = () => toggle();
$("#miniNext").onclick = () => next(false);
setSection("np");
function updateMini() {
  const t = tracks[cur];
  $("#mini").classList.toggle("on", !!t);
  if (!t) return;
  $("#miniTitle").textContent = t.title; $("#miniSub").textContent = t.artist;
  const a = artUrl(t); if ($("#miniArt").getAttribute("src") !== a) $("#miniArt").src = a;
}

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
