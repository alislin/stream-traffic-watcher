# Stream Traffic Watcher

Stream Traffic Watcher 是一个使用 Electron 构建的应用程序，用于监视网络流量。

## 功能

- **server.js**:
    - 创建 HTTP 服务器，用于提供静态文件（`index.html`）。
    - 创建 WebSocket 服务器，用于向客户端发送实时更新。
    - 定时执行 `app.js`，并通知客户端刷新页面。
- **app.js**:
    - 从 API 获取流量数据。
    - 存储流量数据到文件。
    - 计算每日流量使用量。
    - 显示流量数据。

## 安装

使用 npm 安装依赖项：

```bash
npm install
```

## 使用

使用 npm 启动应用程序：

```bash
npm start
```

## 贡献

欢迎贡献代码！请提交 pull request。