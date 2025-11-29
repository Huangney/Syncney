console.log("preload.js 已加载");

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serialAPI', {
  openPort: (config) => ipcRenderer.invoke('open-port', config),
  writeData: (data) => ipcRenderer.invoke('write-data', data),
  onData: (callback) => ipcRenderer.on('serial-data', (_, msg) => callback(msg)),
  listPorts: () => ipcRenderer.invoke('list-ports'),
  closePort: () => ipcRenderer.invoke('close-port')
});

contextBridge.exposeInMainWorld('windowAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
});
