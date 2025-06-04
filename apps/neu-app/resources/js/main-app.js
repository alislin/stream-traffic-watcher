import { startBackendService, stopBackendService } from "./service-manager.js";

Neutralino.init();

// 配置参数
const SERVICE_PORT = 21110;
const APP_PATH = `${NL_PATH}/app`;

let backendService = null;

Neutralino.events.on("ready", async () => {
  // 1. 启动后台服务
  //   const serviceStarted = await startBackendService(SERVICE_PORT, APP_PATH);
  await Neutralino.extensions.dispatch("backend", "init");
  // 启动服务
  backendService = await Neutralino.extensions.dispatch(
    "backend",
    "startService",
    {
      port: 21110,
      path: `${NL_PATH}/app`,
    }
  );

  try {
    // 检查扩展是否加载
    const extensions = await Neutralino.extensions.getStats();
    console.log("已加载扩展:", extensions);

    if (!extensions.find((ext) => ext.id === "backend")) {
      throw new Error("后端扩展未加载");
    }

    // 启动服务...
  } catch (err) {
    console.error("扩展检查失败:", err);
    Neutralino.app.exit(1);
  }

  // if (!serviceStarted) {
  //     Neutralino.app.exit(1);
  //     return;
  // }

  await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒

  // 2. 创建应用窗口
  await Neutralino.window.create({
    url: `http://localhost:${SERVICE_PORT}`,
    title: "流量统计",
    width: 970,
    height: 750,
    icon: `${NL_PATH}/resources/icons/512x512.png`,
    enableInspector: process.env.NEUTRINO_DEBUG === "true",
    exitProcessOnClose: true,
  });

  console.log("应用启动完成");
});

// 应用关闭时清理资源
Neutralino.events.on("close", () => {
  backendService?.stop();
});
