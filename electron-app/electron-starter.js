import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";

const hostname = "127.0.0.1";
const port = 23110;
let tray = null;
let mainWindow;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 970,
    height: 750,
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true, // 隐藏菜单栏
    icon: path.join(__dirname, 'assets', 'stream-traffic.png') // 窗口图标
  })

  // 添加重试逻辑
  const tryLoad = () => {
    mainWindow.loadURL(`http://${hostname}:${port}/`).catch((err) => {
      console.log("Retrying in 1 second...");
      setTimeout(tryLoad, 1000);
    });
  };

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  tryLoad();
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'stream-traffic.png')
  const icon = nativeImage.createFromPath(iconPath)

  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
        }
      }
    },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ]);

  tray.setToolTip('我的 Electron 应用');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

// 在 Electron 应用准备就绪后打开外部链接
app.whenReady().then(() => {
  // 启动 server.js
  import('./app/server.cjs').then(module => {
    module.flowServer({ port: port });
  });

  createWindow();
  createTray();

  // let mainWindow = new BrowserWindow({
  //   width: 970,
  //   height: 750,
  //   webPreferences: {
  //     nodeIntegration: true,
  //   },
  //   autoHideMenuBar: true, // 隐藏菜单栏
  // });

  // // mainWindow.loadURL(`http://${hostname}:${port}/`);
  // // 添加重试逻辑
  // const tryLoad = () => {
  //   mainWindow.loadURL(`http://${hostname}:${port}/`).catch((err) => {
  //     console.log("Retrying in 1 second...");
  //     setTimeout(tryLoad, 1000);
  //   });
  // };

  // tryLoad();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('before-quit', () => {
  if (tray) {
    tray.destroy()
  }
});