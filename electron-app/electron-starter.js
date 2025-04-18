import { app, BrowserWindow } from "electron";
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";

const hostname = "127.0.0.1";
const port = 23110;

// 在 Electron 应用准备就绪后打开外部链接
app.whenReady().then(() => {
  // 启动 server.js
  import('./app/server.cjs').then(module => {
    module.flowServer({ port: port });
  });

  let win = new BrowserWindow({
    width: 970,
    height: 750,
    webPreferences: {
      nodeIntegration: true,
    },
    autoHideMenuBar: true, // 隐藏菜单栏
  });

  // win.loadURL(`http://${hostname}:${port}/`);
  // 添加重试逻辑
  const tryLoad = () => {
    win.loadURL(`http://${hostname}:${port}/`).catch((err) => {
      console.log("Retrying in 1 second...");
      setTimeout(tryLoad, 1000);
    });
  };

  tryLoad();
});
