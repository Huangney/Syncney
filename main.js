const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron')
// 导入 Electron 框架里的 app（应用控制）、BrowserWindow（窗口管理）、ipcMain（主进程通信）对象
const path = require('path')
// 导入 Node.js 的 path 模块，用于处理文件路径
const { SerialPort } = require('serialport')
// 导入 serialport 库里的 SerialPort 类，用于操作串口

let port = null
// 定义一个变量 port，用来保存串口对象，初始值为 null（还没打开串口）

function createWindow() {
  // 获取主屏幕尺寸
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: screenW * 0.6,
    height: screenH * 0.6,
    minWidth: 900,
    minHeight: 600,
    maxWidth: screenW,
    maxHeight: screenH,

    frame: false,         // 关键：无边框
    
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,      // 新增
      contextIsolation: true     // 新增
    }
  })

  win.loadFile('index.html')
  // 启动时自动打开 DevTools
  // win.webContents.openDevTools() 
  // 监听 F12 打开 DevTools
  win.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' && input.type === 'keyDown') {
          win.webContents.openDevTools();
      }
  });

  console.log("窗口已创建") 
}// 创建一个新窗口，窗口大小 800x600，加载 index.html 页面，并指定预加载脚本 preload.js



/**
 * @brief 打开串口
 * @param {IpcMainInvokeEvent} event Electron 主进程的事件对象，用于与渲染进程通信
 * @param {Object} config 串口配置对象，包含 path（串口号，如 'COM3'）、baudRate（波特率，如 9600）
 * @returns {boolean} 串口打开成功返回 true，失败可抛出异常
 */
function handleOpenPort(event, config)
{
    console.log("正在打开串口")
    return new Promise((resolve) => {
        port = new SerialPort({
        path: config.path,
        baudRate: config.baudRate
        });

        port.on('open', () => {
        resolve({ success: true });
        });

        port.on('error', (err) => {
        resolve({ success: false, message: err.message });
        });

        port.on('data', data => {
        event.sender.send('serial-data', data.toString());
        });
    });
}

/**
 * @brief 获取串口列表
 * @returns {Array} 串口信息数组
 */
async function handleListPorts() {
  const ports = await SerialPort.list();
  // 返回格式：[{ path: 'COM3', manufacturer: '...', ... }, ...]
  return ports;
}


/**
 * @brief 关闭串口
 * @returns {boolean} 关闭成功返回 true，未打开返回 false
 */
function handleClosePort() 
{
  if (port && port.isOpen) 
  {
    port.close();
    port = null;
    return true;
  }
  return false;
}

/**
 * @brief 写数据到串口
 * @param {IpcMainInvokeEvent} event Electron 主进程的事件对象，用于与渲染进程通信
 * @param {*} data 要写入串口的数据，可以是字符串或 Buffer
 * @returns {void} 无返回值，仅执行写操作
 */
function handleWriteData(event, data) {
  if (port) port.write(data);
}

app.whenReady().then(() => {
    createWindow();
    
    ipcMain.handle('open-port', handleOpenPort);

    ipcMain.handle('close-port', handleClosePort);

    ipcMain.handle('list-ports', handleListPorts);

    ipcMain.handle('write-data', handleWriteData);
})
// Electron 应用启动后，创建窗口


/***---<    软件最小化、最大化、关闭    >---***/
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});
ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});
ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});


/***---<    软件的JSON IO    >---***/
const fs = require('fs');
ipcMain.handle('save-json', async (event, filePath, content) => {
    fs.writeFileSync(filePath, content, 'utf-8');
})
ipcMain.handle('read-json', async (event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('select-folder', async () => 
{
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
});

ipcMain.handle('select-file', async () => 
{
  const win = BrowserWindow.getFocusedWindow();

  const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  // 恢复主窗口焦点
  if (win)
  {
    win.focus();
    win.webContents.focus();
    setTimeout(() => {
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'A' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'A' });
    }, 100);
  } 
    
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
});
