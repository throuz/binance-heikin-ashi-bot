import schedule from "node-schedule";
import { setDynamicConfig } from "./configs/dynamic-config.js";
import { errorHandler, logWithTime, sendLineNotify } from "./src/common.js";
import {
  getIsCloseConditionsMet,
  getIsOpenConditionsMet
} from "./src/conditions.js";
import { getAvailableBalance, getHasPositions } from "./src/helpers.js";
import { closePosition, openPosition } from "./src/trade.js";

const logBalance = async () => {
  const availableBalance = await getAvailableBalance();
  await sendLineNotify(`Balance: ${availableBalance}`);
};

const executeTradingStrategy = async () => {
  try {
    const hasPositions = await getHasPositions();
    logWithTime(`hasPositions: ${hasPositions}`);
    if (!hasPositions) {
      const isOpenConditionsMet = await getIsOpenConditionsMet();
      logWithTime(`isOpenConditionsMet: ${isOpenConditionsMet}`);
      if (isOpenConditionsMet) {
        await openPosition();
      }
    }
    if (hasPositions) {
      const isCloseConditionsMet = await getIsCloseConditionsMet();
      logWithTime(`isCloseConditionsMet: ${isCloseConditionsMet}`);
      if (isCloseConditionsMet) {
        await closePosition();
        await logBalance();
      }
    }
    await setDynamicConfig();
  } catch (error) {
    await errorHandler(error);
  }
};

await setDynamicConfig();

schedule.scheduleJob("1 * * * *", executeTradingStrategy);
