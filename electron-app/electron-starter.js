import { shell, app, BrowserWindow } from "electron";
import { spawn } from "child_process";

const hostname = "127.0.0.1";
const port = 23110;

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 在 Electron 应用准备就绪后打开外部链接
app.whenReady().then(() => {
  // 启动 server.js
  const serverProcess = spawn("node", ["../server.js", "url.txt"], {
    cwd: __dirname,
    stdio: "inherit",
    encoding: "utf-8",
  });

  serverProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`server.js 执行失败，退出代码 ${code}`);
    } else {
      console.log("server.js 执行完成。");
    }
  });

  serverProcess.on("error", (err) => {
    console.error("启动 server.js 失败:", err);
  });

  let win = new BrowserWindow({
    width: 970,
    height: 750,
    webPreferences: {
      nodeIntegration: true,
    },
    autoHideMenuBar: true, // 隐藏菜单栏
  });

  win.loadURL(`http://${hostname}:${port}/`);
});
