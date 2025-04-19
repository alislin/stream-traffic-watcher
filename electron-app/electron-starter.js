import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import path from 'path';
import http from 'http';
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
  createWindow();
  createTray();

  // 启动 server.js
  import('./app/server.cjs').then(module => {
    module.flowServer({ port: port });
    updateTrayData(); // 首次更新
    setInterval(updateTrayData, 5 * 60 * 1000); // 每 5 分钟更新一次
  });

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

function getFlowData() {
  return new Promise((resolve, reject) => {
    http.get(`http://${hostname}:${port}/data/data.json`, (res) => { // 替换为您的 flowServer 地址
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const flowData = JSON.parse(data);
          resolve(flowData);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function updateTrayData() {
  try {
    const flowData = await getFlowData();
    if (flowData) {
      const monthlyLimit = formatBytes(flowData.monthly_bw_limit_b);
      const used = formatBytes(flowData.bw_counter_b);
      const remaining = formatBytes(flowData.monthly_bw_limit_b - flowData.bw_counter_b);
      const remainingDays = calculateRemainingDays(flowData.bw_reset_day_of_month);
      const tooltip = `总流量: ${monthlyLimit}\n已使用: ${used}\n剩余流量: ${remaining}\n剩余天数: ${remainingDays}`;
      tray.setToolTip(tooltip);
    } else {
      tray.setToolTip('无法获取流量数据');
    }
  } catch (e) {
    console.error(e);
    tray.setToolTip('无法获取流量数据');
  }
}

function calculateRemainingDays(resetDay) {
  const today = new Date();
  const currentDay = today.getDate();
  let remainingDays = resetDay - currentDay;
  if (remainingDays < 0) {
    remainingDays += new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - currentDay + resetDay;
  }
  return remainingDays;
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }
  return bytes.toFixed(2) + ' ' + units[unitIndex];
}
