// 存储日志的数组
const backendLogs = [];
const MAX_LOG_ENTRIES = 1000; // 最多保存1000条日志

// 自定义日志函数
export function logToBackendConsole(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message };

  // 添加到日志数组
  backendLogs.push(logEntry);
  if (backendLogs.length > MAX_LOG_ENTRIES) {
    backendLogs.shift(); // 移除最旧的日志
  }

  // 发送到渲染进程（如果窗口已创建）
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("backend-log", logEntry);
  }

  // 同时在控制台输出（开发环境）
  if (!app.isPackaged) {
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (level === "error") {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }

//   function log(message) {
//     // 发送到渲染进程（如果窗口已创建）
//     if (mainWindow && !mainWindow.isDestroyed()) {
//       const timestamp = new Date().toISOString();
//       const logEntry = { timestamp, level: "info", message };
//       mainWindow.webContents.send("backend-log", logEntry);
//     }
//   }
//   return {
//     log,
//   };
}
