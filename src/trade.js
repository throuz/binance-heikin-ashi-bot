import { SYMBOL, LEVERAGE } from "../configs/trade-config.js";
import { changeInitialLeverageAPI, newOrderAPI } from "./api.js";
import { sendLineNotify } from "./common.js";
import {
  formatBySize,
  getOrderQuantity,
  getPositionInformation,
  getStepSize
} from "./helpers.js";

const changeToMaxLeverage = async () => {
  const totalParams = {
    symbol: SYMBOL,
    leverage: LEVERAGE,
    timestamp: Date.now()
  };
  await changeInitialLeverageAPI(totalParams);
  await sendLineNotify(`Change To Max Leverage! ${SYMBOL} ${LEVERAGE}`);
};

const newOrder = async (totalParams) => {
  await newOrderAPI(totalParams);
  const { symbol, side, quantity } = totalParams;
  await sendLineNotify(`New order! ${symbol} ${side} ${quantity}`);
};

export const openPosition = async () => {
  const positionInformation = await getPositionInformation();
  if (Number(positionInformation.leverage) !== LEVERAGE) {
    await changeToMaxLeverage();
  }
  const [orderQuantity, stepSize] = await Promise.all([
    getOrderQuantity(),
    getStepSize()
  ]);
  await newOrder({
    symbol: SYMBOL,
    side: "BUY",
    type: "MARKET",
    quantity: formatBySize(orderQuantity, stepSize),
    timestamp: Date.now()
  });
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
      timestamp: Date.now()
    });
    await sendLineNotify("Close position!");
  }
};
