import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import cron from "node-cron";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import { flowCheck } from "./flowCheck.js";

export function flowServer(opt) {
  const hostname = "127.0.0.1";
  const port = opt?.port ?? 23110;
  const wsPort = opt?.port ?? port + 1; // WebSocket 端口
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const directoryToServe = __dirname; // 服务当前目录
  const appFile =
    process.env.NODE_ENV === "production" ? "flowCheck.cjs" : "flowCheck.js";

  function runAppJS() {
    console.log("Running flowCheck at startup...");
    flowCheck({ file: "url.txt", onFinish: () => broadcast("reload") });
    return;
  }

  // 创建 WebSocket 服务器
  const wss = new WebSocketServer({ port: wsPort });

  wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("close", () => console.log("Client disconnected"));
  });

  function broadcast(message) {
    wss.clients.forEach((client) => {
      client.send(message);
    });
  }

  const server = http.createServer((req, res) => {
    let filePath = path.join(
      directoryToServe,
      req.url === "/" ? "index.html" : req.url
    );
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === "ENOENT") {
          // 文件未找到
          res.writeHead(404);
          res.end("404 Not Found");
        } else {
          // 服务器错误
          res.writeHead(500);
          res.end("500 Internal Server Error: " + err.code);
        }
      } else {
        // 成功读取文件
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(content);
      }
    });
  });

  function getContentType(filePath) {
    let extname = path.extname(filePath);
    switch (extname) {
      case ".html":
        return "text/html";
      case ".js":
        return "text/javascript";
      case ".css":
        return "text/css";
      case ".json":
        return "application/json";
      case ".png":
        return "image/png";
      case ".jpg":
        return "image/jpg";
      default:
        return "application/octet-stream";
    }
  }

  // 每 1 分钟执行一次 flowCheck.js (测试用)
  cron.schedule("*/1 * * * *", () => {
    runAppJS();
    return;
  });

  runAppJS();

  server.listen(port, hostname, () => {
    const serviceUrl = `http://${hostname}:${port}/`;
    console.log(`HTTP Server running at ${serviceUrl}`);
    console.log(`WebSocket Server running at ws://${hostname}:${wsPort}`);
  });
}
