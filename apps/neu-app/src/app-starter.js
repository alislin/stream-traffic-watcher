import { fileURLToPath } from 'url';
import path from 'path';

const hostname = "127.0.0.1";
const port = 23110;

let tray = null;
let mainWindow;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("start neu app");
Neutralino.debug.log("Neutralino 初始化完成");


function createWindow() {
  Neutralino.window.create(`http://${hostname}:${port}/`, { // 假设入口 HTML 文件是 index.html
    width: 970,
    height: 750,
    minWidth: 400,
    minHeight: 200,
    title: "Stream Traffic Watcher",
    icon: "/assets/stream-traffic.png", // Neutralinojs 中图标路径以 /assets 开头
    autoHideMenuBar: true, // 隐藏菜单栏 (Neutralinojs 默认无菜单栏，此项可能无效)
  }).then((win) => {
    mainWindow = win;

    Neutralino.window.on('windowClose', () => {
      Neutralino.app.exit(); // 简化关闭逻辑，直接退出应用
    });
  }).catch((err) => {
    console.error("Failed to create window", err);
  });
}

function createTray() {
  const iconPath = '/assets/stream-traffic.png'; // Neutralinojs 中图标路径以 /assets 开头
  Neutralino.os.showTray({
    icon: iconPath,
    menuItems: [
      {
        id: 'show',
        text: '显示'
      },
      {
        id: 'exit',
        text: '退出'
      }
    ]
  }).then(() => {
    tray = true; // 标记托盘已创建

    Neutralino.events.on('trayMenuItemClicked', (event) => {
      switch (event.detail.id) {
        case 'show':
          if (mainWindow) {
            Neutralino.window.show();
          } else {
            createWindow(); // 如果主窗口不存在，则创建
          }
          break;
        case 'exit':
          Neutralino.app.exit();
          break;
      }
    });

    Neutralino.events.on('trayIconClicked', () => {
      if (mainWindow) {
        Neutralino.window.isVisible().then((visible) => {
          if (visible) {
            Neutralino.window.hide();
          } else {
            Neutralino.window.show();
          }
        });
      } else {
        createWindow(); // 如果主窗口不存在，则创建
      }
    });


  }).catch((err) => {
    console.error("Failed to show tray", err);
  });
}

Neutralino.app.on('ready', () => {
  createWindow();
  createTray();
});

Neutralino.app.on('exit', () => {
  if (tray) {
    Neutralino.os.hideTray(); // 退出时隐藏托盘 (Neutralinojs 默认行为，可省略)
  }
});
