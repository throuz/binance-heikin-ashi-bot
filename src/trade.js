import { getDynamicConfig } from "../configs/dynamic-config.js";
import { SYMBOL, ORDER_AMOUNT_PERCENT } from "../configs/trade-config.js";
import { changeInitialLeverageAPI, newOrderAPI } from "./api.js";
import { logWithTime, sendLineNotify } from "./common.js";
import {
  formatBySize,
  getOrderQuantity,
  getPositionInformation,
  getStepSize
} from "./helpers.js";

const changeToMaxLeverage = async () => {
  const { leverage } = getDynamicConfig();
  const totalParams = {
    symbol: SYMBOL,
    leverage: leverage,
    recvWindow: 60000,
    timestamp: Date.now()
  };
  await changeInitialLeverageAPI(totalParams);
  await sendLineNotify(`Change To Max Leverage! ${SYMBOL} ${leverage}`);
};

const newOrder = async (totalParams) => {
  await newOrderAPI(totalParams);
  const { symbol, side, quantity } = totalParams;
  await sendLineNotify(`New order! ${symbol} ${side} ${quantity}`);
};

const newOpenOrder = async (orderAmountPercent) => {
  try {
    const [orderQuantity, stepSize] = await Promise.all([
      getOrderQuantity(orderAmountPercent),
      getStepSize()
    ]);
    await newOrder({
      symbol: SYMBOL,
      side: "BUY",
      type: "MARKET",
      quantity: formatBySize(orderQuantity, stepSize),
      recvWindow: 60000,
      timestamp: Date.now()
    });
  } catch (error) {
    if (error.response && error.response.data.code === -2019) {
      console.log("orderAmountPercent:", orderAmountPercent);
      logWithTime(error.response.data.msg);
      await newOpenOrder(orderAmountPercent - 1);
    } else {
      throw error;
    }
  }
};

export const openPosition = async () => {
  const positionInformation = await getPositionInformation();
  const { leverage } = getDynamicConfig();
  if (Number(positionInformation.leverage) !== leverage) {
    await changeToMaxLeverage();
  }
  await newOpenOrder(ORDER_AMOUNT_PERCENT);
  await sendLineNotify("Open position!");
};

export const closePosition = async () => {
  const positionInformation = await getPositionInformation();
  const { positionAmt } = positionInformation;
  const amount = Math.abs(positionAmt);
  if (amount > 0) {
    await newOrder({
      symbol: SYMBOL,
      side: "SELL",
      type: "MARKET",
      quantity: amount,
      recvWindow: 60000,
      timestamp: Date.now()
    });
    await sendLineNotify("Close position!");
  }
};
