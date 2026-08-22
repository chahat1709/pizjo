const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { createDataStore } = require('./data-store.cjs');

let store;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1040,
    minHeight: 680,
    title: 'Pizjo Admin',
    backgroundColor: '#fff7e9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });
  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

app.whenReady().then(() => {
  const dataDir = app.getPath('userData');
  store = createDataStore({
    databasePath: path.join(dataDir, 'pizjo-desktop.db'),
    menuPath: path.join(__dirname, 'data', 'menu.json'),
  });

  ipcMain.handle('pizjo:bootstrap', () => store.bootstrap());
  ipcMain.handle('pizjo:setup', (_event, payload) => store.setupOwner(payload));
  ipcMain.handle('pizjo:sign-in', (_event, payload) => store.signIn(payload));
  ipcMain.handle('pizjo:sign-out', (_event, session) => store.signOut(session));
  ipcMain.handle('pizjo:state', (_event, session) => store.getState(session));
  ipcMain.handle('pizjo:action', (_event, session, action) => store.perform(session, action));
  ipcMain.handle('pizjo:backup', async (_event, session) => {
    store.requireAdmin(session);
    const selection = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Pizjo backup',
      defaultPath: `pizjo-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'Pizjo database backup', extensions: ['db'] }],
    });
    if (selection.canceled || !selection.filePath) return { cancelled: true };
    store.backupTo(selection.filePath);
    return { cancelled: false, filePath: selection.filePath };
  });
  ipcMain.handle('pizjo:restore', async (_event, session) => {
    store.requireAdmin(session);
    const selection = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a Pizjo backup to restore',
      properties: ['openFile'],
      filters: [{ name: 'Pizjo database backup', extensions: ['db'] }],
    });
    if (selection.canceled || !selection.filePaths[0]) return { cancelled: true };
    const confirm = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Restore backup', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      message: 'Restore this backup?',
      detail: 'Current local Pizjo records will be replaced. A safety copy is created first.',
    });
    if (confirm.response !== 0) return { cancelled: true };
    store.restoreFrom(selection.filePaths[0]);
    app.relaunch();
    app.exit(0);
    return { cancelled: false };
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (store) store.close();
});
