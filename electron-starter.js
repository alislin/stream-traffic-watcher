import { shell, app, BrowserWindow } from 'electron';

const hostname = '127.0.0.1';
const port = 23110;

// 在 Electron 应用准备就绪后打开外部链接
app.whenReady().then(() => {
  let win = new BrowserWindow({
    width: 970,
    height: 750,
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true, // 隐藏菜单栏
  })

  win.loadURL(`http://${hostname}:${port}/`)
})
