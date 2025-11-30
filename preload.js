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
  close: () => ipcRenderer.send('window-close'),
  saveJson: (filePath, content) => ipcRenderer.invoke('save-json', filePath, content),
  readJson: (filePath) => ipcRenderer.invoke('read-json', filePath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveText: (filePath, text) => ipcRenderer.invoke('save-text', filePath, text),
});
