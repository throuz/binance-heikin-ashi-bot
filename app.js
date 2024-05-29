import schedule from "node-schedule";
import { getBestResult } from "./src/backtest.js";
import { nodeCache } from "./src/cache.js";
import { getCachedKlineData } from "./src/cached-data.js";
import { errorHandler, sendLineNotify } from "./src/common.js";
import {
  getAvailableBalance,
  getPositionType,
  getIsUnRealizedProfit
} from "./src/helpers.js";
import { getSignal } from "./src/signal.js";
import { closePosition, openPosition } from "./src/trade.js";

const setSignalConfigs = async () => {
  const bestResult = await getBestResult();
  const {
    isStillHasPosition,
    avgVolPeriod,
    openAvgVolFactor,
    closeAvgVolFactor,
    leverage
  } = bestResult;
  nodeCache.mset([
    { key: "isStillHasPosition", val: isStillHasPosition, ttl: 0 },
    { key: "avgVolPeriod", val: avgVolPeriod, ttl: 0 },
    { key: "openAvgVolFactor", val: openAvgVolFactor, ttl: 0 },
    { key: "closeAvgVolFactor", val: closeAvgVolFactor, ttl: 0 },
    { key: "leverage", val: leverage, ttl: 0 }
  ]);
  console.log(bestResult);
  console.log("==============================================================");
};

const logBalance = async () => {
  const availableBalance = await getAvailableBalance();
  await sendLineNotify(`Balance: ${availableBalance}`);
};

const executeStrategy = async () => {
  try {
    const positionType = await getPositionType();
    const {
      isStillHasPosition,
      avgVolPeriod,
      openAvgVolFactor,
      closeAvgVolFactor
    } = nodeCache.mget([
      "avgVolPeriod",
      "openAvgVolFactor",
      "closeAvgVolFactor"
    ]);
    if (isStillHasPosition) {
      await setSignalConfigs();
    } else {
      const cachedKlineData = await getCachedKlineData();
      const isUnRealizedProfit = await getIsUnRealizedProfit();
      const signal = await getSignal({
        positionType,
        index: cachedKlineData.length - 1,
        avgVolPeriod,
        openAvgVolFactor,
        closeAvgVolFactor,
        isUnRealizedProfit
      });
      if (signal === "OPEN_LONG") {
        await openPosition("BUY");
      }
      if (signal === "CLOSE_LONG") {
        await closePosition("SELL");
        await logBalance();
        await setSignalConfigs();
      }
      if (signal === "OPEN_SHORT") {
        await openPosition("SELL");
      }
      if (signal === "CLOSE_SHORT") {
        await closePosition("BUY");
        await logBalance();
        await setSignalConfigs();
      }
      if (positionType === "NONE" && signal === "NONE") {
        await setSignalConfigs();
      }
    }
  } catch (error) {
    await errorHandler(error);
  }
};

await setSignalConfigs();

schedule.scheduleJob("1 * * * *", executeStrategy);
