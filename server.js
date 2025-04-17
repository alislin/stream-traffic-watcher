import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import cron from 'node-cron';
import { WebSocketServer } from 'ws';

const hostname = '127.0.0.1';
const port = 23110;
const wsPort = 23111; // WebSocket 端口
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directoryToServe = __dirname; // 服务当前目录

function runAppJS() {
  console.log('Running app.js at startup...');
  const appProcess = spawn('node', ['app.js', 'url.txt'], {
    cwd: directoryToServe,
    stdio: 'inherit' // 将子进程的输出导入到当前进程
  });

  appProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`app.js 执行失败，退出代码 ${code}`);
    } else {
      console.log('app.js 执行完成。');
    }
  });

  appProcess.on('error', (err) => {
    console.error('启动 app.js 失败:', err);
  });

  appProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`app.js 执行失败，退出代码 ${code}`);
    } else {
      console.log('app.js 执行完成，通知客户端刷新页面。');
      broadcast('reload'); // 发送刷新消息
    }
  });
}

runAppJS();

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ port: wsPort });

wss.on('connection', ws => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

function broadcast(message) {
  wss.clients.forEach(client => {
    client.send(message);
  });
}

const server = http.createServer((req, res) => {
  let filePath = path.join(directoryToServe, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件未找到
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // 服务器错误
        res.writeHead(500);
        res.end('500 Internal Server Error: ' + err.code);
      }
    } else {
      // 成功读取文件
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    }
  });
});

function getContentType(filePath) {
  let extname = path.extname(filePath);
  switch (extname) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpg';
    default:
      return 'application/octet-stream';
  }
}

// 每 1 分钟执行一次 app.js (测试用)
cron.schedule('*/30 * * * *', () => {
  console.log('Running app.js...');
  const appProcess = spawn('node', ['app.js', 'url.txt'], {
    cwd: directoryToServe,
    stdio: 'inherit' // 将子进程的输出导入到当前进程
  });

  appProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`app.js 执行失败，退出代码 ${code}`);
    } else {
      console.log('app.js 执行完成，通知客户端刷新页面。');
      broadcast('reload'); // 发送刷新消息
    }
  });

  appProcess.on('error', (err) => {
    console.error('启动 app.js 失败:', err);
  });
});

server.listen(port, hostname, () => {
  const serviceUrl = `http://${hostname}:${port}/`;
  console.log(`HTTP Server running at ${serviceUrl}`);
  console.log(`WebSocket Server running at ws://${hostname}:${wsPort}`);
});
