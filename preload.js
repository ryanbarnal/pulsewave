// Pulsewave desktop: the small, safe bridge between the app window and the computer
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("pulsewaveDesktop", {
  // songs you double-click (or "Open with → Pulsewave") arrive here
  onOpenFiles: cb => ipcRenderer.on("pw-open-files", (_e, items) => cb(items)),
  ready: () => ipcRenderer.send("pw-ready"),
  // 30-day trial, then an activation key
  license: { status: () => ipcRenderer.invoke("pw-license"), activate: key => ipcRenderer.invoke("pw-activate", key) }
});
