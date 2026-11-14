// Pulsewave desktop app — created by Ryan Ocbina Barnal
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 380, minHeight: 600,
    backgroundColor: "#0b0b1a", title: "Pulsewave",
    icon: path.join(__dirname, "build", "icon.png"),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  win.loadFile(path.join(__dirname, "web", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow", overrideBrowserWindowOptions: { autoHideMenuBar: true, backgroundColor: "#0b0b1a" } };
  });
}

const menu = [
  ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
  { role: "fileMenu" }, { role: "viewMenu" }, { role: "windowMenu" },
  { role: "help", submenu: [
    { label: "Pulsewave Manual", click: () => { const w = new BrowserWindow({ width: 900, height: 800, autoHideMenuBar: true, backgroundColor: "#0b0b1a" }); w.loadFile(path.join(__dirname, "web", "help.html")); } },
    { label: "About — Created by Ryan Ocbina Barnal", enabled: false }
  ] }
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  app.setAboutPanelOptions({ applicationName: "Pulsewave", applicationVersion: app.getVersion(), copyright: "© 2026 Ryan Ocbina Barnal", credits: "Created by Ryan Ocbina Barnal" });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
