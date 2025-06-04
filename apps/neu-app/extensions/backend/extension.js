module.exports = {
  init: async () => {
    console.log("后端扩展初始化成功");
    return { ready: true };
  },

  startService: async ({ port, path }) => {
    const fs = require("fs");
    console.log("服务路径:", `${NL_PATH}/app/server.cjs`);
    console.log("路径存在:", fs.existsSync(`${NL_PATH}/app/server.cjs`));

    const { flowServer } = require(`${NL_PATH}/app/server.cjs`);
    const server = flowServer({ port, path });

    // 托盘更新逻辑
    const updateTray = () => {
      const { exec } = require("child_process");
      exec("你的命令", (err, stdout) => {
        if (err) console.error(err);
        else console.log("托盘更新:", stdout);
      });
    };

    updateTray();
    const interval = setInterval(updateTray, 5 * 60 * 1000);

    return {
      stop: () => {
        clearInterval(interval);
        server?.close();
      },
    };
  },
};
