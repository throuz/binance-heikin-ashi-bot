import schedule from "node-schedule";
import { errorHandler, logWithTime, sendLineNotify } from "./src/common.js";
import { getAvailableBalance, getHasPositions } from "./src/helpers.js";
import { openPosition, closePosition } from "./src/trade.js";
import {
  getIsOpenConditionsMet,
  getIsCloseConditionsMet
} from "./src/conditions.js";

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
  } catch (error) {
    await errorHandler(error);
  }
};

schedule.scheduleJob("0 * * * *", executeTradingStrategy);
