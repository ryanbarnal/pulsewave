// Pulsewave desktop app — created by Ryan Ocbina Barnal
const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");

/* ---------- 30-day free trial, then an activation key ----------
   Keys are made on the family server (🏠 → Activation keys) and signed there.
   This is only the PUBLIC half: it can check a key, never make one. */
const LICENSE_PUBLIC_KEY = "MCowBQYDK2VwAyEAJ//4JdwdUydCmsT3YBq+xK3Q2Hv4m8hKBK13fF6+Bb0=";
const TRIAL_DAYS = 30, DAY = 864e5;
const nowMs = () => Date.now() + (!app.isPackaged && process.env.PULSEWAVE_TEST_DAYS ? +process.env.PULSEWAVE_TEST_DAYS * DAY : 0);
const statePaths = () => [path.join(app.getPath("userData"), "state.json"), path.join(app.getPath("appData"), ".pulsewave-state")];
function readState() {
  const st = { first: Infinity, last: 0, key: null };
  for (const p of statePaths()) { try { const s = JSON.parse(fs.readFileSync(p, "utf8")); st.first = Math.min(st.first, s.first || Infinity); st.last = Math.max(st.last, s.last || 0); st.key = st.key || s.key || null; } catch {} }
  return st;
}
function writeState(st) { for (const p of statePaths()) { try { fs.writeFileSync(p, JSON.stringify(st)); } catch {} } }
function checkKey(key) {
  try {
    const [tag, p, s] = String(key || "").replace(/\s+/g, "").split(".");
    if (tag !== "PW1" || !p || !s) return null;
    const pub = crypto.createPublicKey({ key: Buffer.from(LICENSE_PUBLIC_KEY, "base64"), format: "der", type: "spki" });
    const payload = Buffer.from(p, "base64url");
    if (!crypto.verify(null, payload, pub, Buffer.from(s, "base64url"))) return null;
    const info = JSON.parse(payload.toString("utf8"));
    return info && info.v === 1 && info.n ? info : null;
  } catch { return null; }
}
function licenseStatus() {
  const st = readState(), now = nowMs();
  if (!isFinite(st.first)) st.first = now;
  st.last = Math.max(st.last, now);              // turning the clock back doesn't add days
  writeState(st);
  const lic = st.key && checkKey(st.key);
  if (lic) return { state: "active", name: lic.n };
  const left = Math.max(0, Math.ceil(TRIAL_DAYS - (st.last - st.first) / DAY));
  return { state: left > 0 ? "trial" : "expired", daysLeft: left, trialDays: TRIAL_DAYS };
}
ipcMain.handle("pw-license", () => licenseStatus());
ipcMain.handle("pw-activate", (_e, key) => {
  const lic = checkKey(key);
  if (!lic) return { ok: false, error: "That key isn't valid. Copy the whole key, it starts with PW1." };
  const st = readState(); if (!isFinite(st.first)) st.first = nowMs();
  st.key = String(key).replace(/\s+/g, ""); writeState(st);
  return { ok: true, name: lic.n };
});

// Opened from a double-clicked song: play straight away, no "Tap to start" needed
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

/* ---------- Open songs from the computer (double-click / Open with → Pulsewave) ---------- */
const AUDIO = /\.(mp3|m4a|aac|flac|wav|ogg|oga|opus|webm|aiff?|alac)$/i;
const TYPES = { ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".flac": "audio/flac", ".wav": "audio/wav", ".ogg": "audio/ogg", ".oga": "audio/ogg", ".opus": "audio/ogg", ".webm": "audio/webm", ".aif": "audio/aiff", ".aiff": "audio/aiff", ".alac": "audio/mp4" };
let pending = [], rendererReady = false;
const filesIn = argv => argv.slice(1).filter(a => a && !a.startsWith("-") && AUDIO.test(a) && fs.existsSync(a));
function openPaths(paths) {
  if (!paths.length) return;
  pending.push(...paths);
  if (mainWin) { if (mainWin.isMinimized()) mainWin.restore(); mainWin.show(); mainWin.focus(); }
  flush();
}
async function flush() {
  if (!rendererReady || !mainWin || !pending.length) return;
  const items = [];
  for (const p of pending.splice(0)) {
    try {
      const st = await fsp.stat(p); if (st.size > 700 * 1048576) continue;
      let lrc = null; try { lrc = await fsp.readFile(p.replace(/\.[^.\\/]+$/, ".lrc"), "utf8"); } catch {}
      items.push({ name: path.basename(p), type: TYPES[path.extname(p).toLowerCase()] || "", mtime: st.mtimeMs, data: await fsp.readFile(p), lrc });
    } catch (e) { console.log("can't open", p, e.message); }
  }
  if (items.length) mainWin.webContents.send("pw-open-files", items);
}
ipcMain.on("pw-ready", () => { rendererReady = true; flush(); });
// macOS hands files over with an event (it can arrive before the app is ready)
app.on("open-file", (e, p) => { e.preventDefault(); openPaths([p]); });
// One window only: a second double-click goes to the Pulsewave that's already open
const firstCopy = app.requestSingleInstanceLock();
if (!firstCopy) app.quit();
else app.on("second-instance", (_e, argv) => { openPaths(filesIn(argv)); if (mainWin) { if (mainWin.isMinimized()) mainWin.restore(); mainWin.focus(); } });

const DOWNLOAD_PAGE = "https://pulsewave.ryanbarnal.com/download.html";
const RELEASES_API = "https://api.github.com/repos/ryanbarnal/pulsewave/releases/latest";
let mainWin = null;

function createWindow() {
  mainWin = new BrowserWindow({
    width: 1280, height: 820, minWidth: 380, minHeight: 600,
    backgroundColor: "#0e0e11", title: "Pulsewave",
    icon: path.join(__dirname, "build", "icon.png"),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "preload.js"), devTools: !app.isPackaged }
  });
  rendererReady = false;
  mainWin.loadFile(path.join(__dirname, "web", "index.html"));
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow", overrideBrowserWindowOptions: { autoHideMenuBar: true, backgroundColor: "#0e0e11" } };
  });
}

/* ---------- Automatic updates ---------- */
// Windows: download in the background, then offer to restart (electron-updater + GitHub Releases).
// Mac: an unsigned app can't replace itself, so we check GitHub and offer the download page.
const newer = (a, b) => {   // is version a newer than b?
  const x = String(a).replace(/^v/, "").split(".").map(Number), y = String(b).replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); }
  return false;
};
const prefsFile = () => path.join(app.getPath("userData"), "update-prefs.json");
const readPrefs = () => { try { return JSON.parse(fs.readFileSync(prefsFile(), "utf8")); } catch { return {}; } };
const writePrefs = p => { try { fs.writeFileSync(prefsFile(), JSON.stringify(p)); } catch {} };

let winUpdater = null, checking = false, readyVersion = null;
function setupWindowsUpdater() {
  try { winUpdater = require("electron-updater").autoUpdater; } catch { return; }
  winUpdater.autoDownload = true;
  winUpdater.autoInstallOnAppQuit = true;      // if you choose "Later", it installs the next time you quit
  winUpdater.on("update-downloaded", async info => {
    readyVersion = info.version;
    const r = await dialog.showMessageBox(mainWin, {
      type: "info", buttons: ["Restart now", "Later"], defaultId: 0, cancelId: 1,
      title: "Update ready", message: `Pulsewave ${info.version} is ready to install`,
      detail: "Restart Pulsewave to finish updating. Your library, playlists and settings are kept.\n\nIf you choose Later, it installs the next time you close Pulsewave."
    });
    if (r.response === 0) setImmediate(() => winUpdater.quitAndInstall(true, true));
  });
  winUpdater.on("error", e => console.log("update error:", e && e.message));
}
async function checkForUpdates(manual) {
  if (!app.isPackaged) { if (manual) dialog.showMessageBox(mainWin, { message: "Updates are checked in the installed app." }); return; }
  if (checking) return; checking = true;
  try {
    if (winUpdater) {
      if (readyVersion) { if (manual) winUpdater.quitAndInstall(true, true); return; }
      const r = await winUpdater.checkForUpdates();
      const v = r && r.updateInfo && r.updateInfo.version;
      if (manual) dialog.showMessageBox(mainWin, v && newer(v, app.getVersion())
        ? { type: "info", message: `Downloading Pulsewave ${v}…`, detail: "You'll be asked to restart when it's ready." }
        : { type: "info", message: "You're up to date", detail: `Pulsewave ${app.getVersion()} is the newest version.` });
      return;
    }
    // Mac (and anything else): look at the latest GitHub release
    const res = await fetch(RELEASES_API, { headers: { "Accept": "application/vnd.github+json", "User-Agent": "Pulsewave-desktop" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const latest = (await res.json()).tag_name;
    const prefs = readPrefs();
    if (latest && newer(latest, app.getVersion()) && (manual || prefs.skip !== latest)) {
      const r = await dialog.showMessageBox(mainWin, {
        type: "info", buttons: ["Download", "Later", "Skip this version"], defaultId: 0, cancelId: 1,
        title: "Update available", message: `Pulsewave ${latest.replace(/^v/, "")} is available`,
        detail: `You have ${app.getVersion()}. Download the new version and drag it into Applications (choose Replace). Your library and playlists are kept.`
      });
      if (r.response === 0) shell.openExternal(DOWNLOAD_PAGE);
      if (r.response === 2) writePrefs({ ...prefs, skip: latest });
    } else if (manual) {
      dialog.showMessageBox(mainWin, { type: "info", message: "You're up to date", detail: `Pulsewave ${app.getVersion()} is the newest version.` });
    }
  } catch (e) {
    if (manual) dialog.showMessageBox(mainWin, { type: "warning", message: "Couldn't check for updates", detail: "Check your internet connection and try again." });
  } finally { checking = false; }
}

const menu = [
  ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
  { role: "fileMenu" },
  { label: "View", submenu: [{ role: "reload" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }] },
  { role: "windowMenu" },
  { role: "help", submenu: [
    { label: "Pulsewave Manual", click: () => { const w = new BrowserWindow({ width: 900, height: 800, autoHideMenuBar: true, backgroundColor: "#0e0e11" }); w.loadFile(path.join(__dirname, "web", "help.html")); } },
    { label: "Check for Updates…", click: () => checkForUpdates(true) },
    { type: "separator" },
    { label: `Version ${app.getVersion()} — Created by Ryan Ocbina Barnal`, enabled: false }
  ] }
];

app.whenReady().then(() => {
  if (!firstCopy) return;
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  app.setAboutPanelOptions({ applicationName: "Pulsewave", applicationVersion: app.getVersion(), copyright: "© 2026 Ryan Ocbina Barnal", credits: "Created by Ryan Ocbina Barnal" });
  createWindow();
  openPaths(filesIn(process.argv));      // Windows / Linux: the song you double-clicked
  if (process.platform === "win32") setupWindowsUpdater();
  setTimeout(() => checkForUpdates(false), 8000);                 // shortly after opening
  setInterval(() => checkForUpdates(false), 6 * 3600 * 1000);     // and every 6 hours while open
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
