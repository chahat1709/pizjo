const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pizjoDesktop', {
  bootstrap: () => ipcRenderer.invoke('pizjo:bootstrap'),
  setupOwner: (payload) => ipcRenderer.invoke('pizjo:setup', payload),
  signIn: (payload) => ipcRenderer.invoke('pizjo:sign-in', payload),
  signOut: (session) => ipcRenderer.invoke('pizjo:sign-out', session),
  getState: (session) => ipcRenderer.invoke('pizjo:state', session),
  perform: (session, action) => ipcRenderer.invoke('pizjo:action', session, action),
  backup: (session) => ipcRenderer.invoke('pizjo:backup', session),
  restore: (session) => ipcRenderer.invoke('pizjo:restore', session),
});
