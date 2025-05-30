// flowCheck.js
import fetch from "node-fetch";
import cron from "node-cron";
import fs from "fs";

export function flowCheck(url_opt) {
  const { onStart, onFinish } = url_opt ?? {};
  // 检查 /data 目录是否存在，如果不存在则创建
  const dataDir = "data";
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  let API_URL =
    "https://flow.net/members/getbwcounter.php?id=998706&id=d7e932de-eb68-4c00-8e90-63b420e0824c"; // 默认值
  const DATA_FILE = "data/data.json";
  const DAILY_DATA_FILE_PREFIX = "data/daily-data-";
  const DAILY_DATA_FILE_RECENT = "data/daily-data.json";

  // 从命令行参数或文件中获取 API URL
  function getApiUrl(opt) {
    const args = process.argv.slice(2); // 获取命令行参数，排除 node 和 app.js

    let apiUrl = opt?.url ?? API_URL; // 默认值

    if (args.includes("-url")) {
      const urlIndex = args.indexOf("-url") + 1;
      if (urlIndex < args.length) {
        apiUrl = args[urlIndex];
        console.log("使用命令行参数 -url:", apiUrl);
      } else {
        console.error("Error: -url 参数后缺少 URL 值");
      }
    } else if (opt?.file || args.length > 0) {
      const filename = opt?.file ?? args[0];
      try {
        const fileContent = fs.readFileSync(filename, "utf-8");
        apiUrl = fileContent.trim(); // 读取文件内容作为 API URL
        console.log(`从文件 ${filename} 读取 API URL:`, apiUrl);
      } catch (error) {
        console.error(`Error: 无法读取文件 ${filename}:`, error.message);
      }
    } else {
      console.log("使用默认 API URL:", apiUrl);
    }
    return apiUrl;
  }

  API_URL = getApiUrl(url_opt); // 初始化 API_URL

  function getDailyDataFilename() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${DAILY_DATA_FILE_PREFIX}${year}${month}.json`;
  }

  async function fetchData() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        const message = `网络请求失败，状态码: ${response.status}`;
        console.error(message);
        // 给出更友好的提示
        console.log("请检查网络连接或确认API URL是否正确。");
        throw new Error(message);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch data:", error.message);
      console.log("请检查网络连接或确认API URL是否正确。");
      return null;
    }
  }

  function storeData(data) {
    try {
      data.last_updated = new Date().toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
      }); // 添加时间戳
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to store data:", error);
    }
  }

  function calculateDailyUsage(currentData) {
    const monthlyDataFilename = getDailyDataFilename();
    let monthlyData = {};
    if (fs.existsSync(monthlyDataFilename)) {
      monthlyData = JSON.parse(fs.readFileSync(monthlyDataFilename));
    }

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // 初始化昨天的记录 (如果不存在)
    if (!monthlyData[yesterdayStr]) {
      monthlyData[yesterdayStr] = {
        bw_counter_b: currentData.bw_counter_b,
        daily_usage_b: 0,
        timestamp: new Date(yesterday),
        last_bw_counter_b: currentData.bw_counter_b,
      };
    }

    let yesterdayLastCounter = 0;
    if (monthlyData[yesterdayStr]) {
      yesterdayLastCounter = monthlyData[yesterdayStr].last_bw_counter_b || 0;
    }
    const currentCounter = currentData.bw_counter_b;
    let dailyUsage = currentCounter - yesterdayLastCounter;
    if (dailyUsage < 0) {
      dailyUsage = currentCounter;
    }

    monthlyData[today] = {
      bw_counter_b: currentCounter,
      daily_usage_b: dailyUsage,
      timestamp: new Date(),
      last_bw_counter_b: currentCounter, // 存储当前的 bw_counter_b
    };

    fs.writeFileSync(monthlyDataFilename, JSON.stringify(monthlyData, null, 2));
    updateRecentDailyData(monthlyData);
  }

  function updateRecentDailyData(monthlyData) {
    let recentDailyData = {};
    const dates = Object.keys(monthlyData).sort().slice(-30); // Get last 30 days
    dates.forEach((date) => {
      recentDailyData[date] = monthlyData[date];
    });
    fs.writeFileSync(
      DAILY_DATA_FILE_RECENT,
      JSON.stringify(recentDailyData, null, 2)
    );
  }

  function calculateRemainingDays(resetDay) {
    const today = new Date();
    const currentDay = today.getDate();
    let remainingDays = resetDay - currentDay;
    if (remainingDays < 0) {
      remainingDays +=
        new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() -
        currentDay +
        resetDay;
    }
    return remainingDays;
  }

  function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;
    while (bytes >= 1024 && unitIndex < units.length - 1) {
      bytes /= 1024;
      unitIndex++;
    }
    return bytes.toFixed(2) + " " + units[unitIndex];
  }

  function displayData(data) {
    const remainingDays = calculateRemainingDays(data.bw_reset_day_of_month);
    const monthlyLimit = formatBytes(data.monthly_bw_limit_b);
    const used = formatBytes(data.bw_counter_b);
    const remaining = formatBytes(data.monthly_bw_limit_b - data.bw_counter_b);

    let recentDailyData = {};
    if (fs.existsSync(DAILY_DATA_FILE_RECENT)) {
      recentDailyData = JSON.parse(fs.readFileSync(DAILY_DATA_FILE_RECENT));
    }
    const todayUsage = recentDailyData[new Date().toISOString().split("T")[0]]
      ? formatBytes(
          recentDailyData[new Date().toISOString().split("T")[0]].daily_usage_b
        )
      : "N/A";

    console.log("-------------------- 流量监控 --------------------");
    console.log(`总流量: ${monthlyLimit}`);
    console.log(`已使用: ${used}`);
    console.log(
      `剩余流量: ${remaining} (${Math.round(
        (data.bw_counter_b / data.monthly_bw_limit_b) * 100
      )}%)`
    );
    console.log(`剩余天数: ${remainingDays}`);
    console.log(`今日已用: ${todayUsage}`);
    console.log("-------------------- 最近 30 天使用量 --------------------");
    Object.keys(recentDailyData)
      .sort()
      .forEach((date) => {
        const usage = formatBytes(recentDailyData[date].daily_usage_b);
        console.log(`${date}: ${usage}`);
      });
    console.log("--------------------------------------------------");
    onFinish && onFinish();
  }

  async function main() {
    const data = await fetchData();
    if (data) {
      storeData(data);
      calculateDailyUsage(data);
      displayData(data);
    } else {
      console.error("数据获取失败，程序终止。");
    }
  }

  onStart && onStart();
  main();
}
