let serverInstance = null;
let trayInterval = null;

export const startBackendService = async (port, appPath) => {
    try {
        // 动态导入你的服务模块
        const { flowServer } = await import(`file://${NL_PATH}/app/server.cjs`);
        // const { flowServer } = await import(`/app/server.cjs`);
        
        // 启动服务
        serverInstance = flowServer({
            port: port,
            path: appPath
        });
        
        // 初始化托盘数据
        updateTrayData();
        
        // 设置定时更新
        trayInterval = setInterval(updateTrayData, 5 * 60 * 1000);
        
        return true;
    } catch (err) {
        console.error('服务启动失败:', err);
        return false;
    }
};

export const stopBackendService = () => {
    if (serverInstance && serverInstance.close) {
        serverInstance.close();
    }
    if (trayInterval) {
        clearInterval(trayInterval);
    }
};

const updateTrayData = () => {
    // 这里实现你的托盘数据更新逻辑
    Neutralino.os.execCommand('...')
        .then(output => {
            console.log('托盘数据更新:', output);
        })
        .catch(err => {
            console.error('更新托盘数据失败:', err);
        });
};