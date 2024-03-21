import {
  LEVERAGE,
  ORDER_AMOUNT_PERCENT,
  QUOTE_ASSET,
  KLINE_INTERVAL
} from "../configs/trade-config.js";
import {
  exchangeInformationAPI,
  futuresAccountBalanceAPI,
  markPriceAPI,
  positionInformationAPI,
  klineDataAPI,
  markPriceKlineDataAPI
} from "./api.js";
import { heikinashi } from "technicalindicators";

export const getStepSize = async () => {
  const exchangeInformation = await exchangeInformationAPI();
  const symbolData = exchangeInformation.symbols.find(
    (item) => item.symbol === SYMBOL
  );
  const stepSize = symbolData.filters.find(
    (filter) => filter.filterType === "LOT_SIZE"
  ).stepSize;
  return stepSize;
};

export const getAvailableBalance = async () => {
  const totalParams = { timestamp: Date.now() };
  const futuresAccountBalance = await futuresAccountBalanceAPI(totalParams);
  const availableBalance = futuresAccountBalance.find(
    ({ asset }) => asset === QUOTE_ASSET
  ).availableBalance;
  return availableBalance;
};

const getMarkPrice = async () => {
  const totalParams = { symbol: SYMBOL };
  const markPrice = await markPriceAPI(totalParams);
  return markPrice.markPrice;
};

const getAvailableQuantity = async () => {
  const [availableBalance, markPrice] = await Promise.all([
    getAvailableBalance(),
    getMarkPrice()
  ]);
  const availableFunds = availableBalance * LEVERAGE;
  return availableFunds / markPrice;
};

export const getPositionInformation = async () => {
  const totalParams = { symbol: SYMBOL, timestamp: Date.now() };
  const positionInformation = await positionInformationAPI(totalParams);
  return positionInformation[0];
};

const getAllowableQuantity = async () => {
  const [positionInformation, markPrice] = await Promise.all([
    getPositionInformation(),
    getMarkPrice()
  ]);
  const { maxNotionalValue, positionAmt } = positionInformation;
  const maxAllowableQuantity = maxNotionalValue / markPrice;
  return maxAllowableQuantity - Math.abs(positionAmt);
};

const getInvestableQuantity = async () => {
  const [availableQuantity, allowableQuantity] = await Promise.all([
    getAvailableQuantity(),
    getAllowableQuantity()
  ]);
  return Math.min(availableQuantity, allowableQuantity);
};

const getAllPositionInformation = async () => {
  const totalParams = { timestamp: Date.now() };
  const positionInformation = await positionInformationAPI(totalParams);
  return positionInformation;
};

export const getHasPositions = async () => {
  const allPositionInformation = await getAllPositionInformation();
  return allPositionInformation.some((info) => Math.abs(info.positionAmt) > 0);
};

export const getOrderQuantity = async () => {
  const investableQuantity = await getInvestableQuantity();
  const orderQuantity = investableQuantity * (ORDER_AMOUNT_PERCENT / 100);
  return orderQuantity;
};

export const getKlineData = async () => {
  const totalParams = { symbol: SYMBOL, interval: KLINE_INTERVAL };
  const klineData = await klineDataAPI(totalParams);
  return klineData;
};

export const getMarkPriceKlineData = async (interval = KLINE_INTERVAL) => {
  const totalParams = { symbol: SYMBOL, interval };
  const markPriceKlineData = await markPriceKlineDataAPI(totalParams);
  return markPriceKlineData;
};

export const getHeikinAshiKlineData = async (interval = KLINE_INTERVAL) => {
  const markPriceKlineData = await getMarkPriceKlineData(interval);
  const openPrices = markPriceKlineData.map((kline) => Number(kline[1]));
  const highPrices = markPriceKlineData.map((kline) => Number(kline[2]));
  const lowPrices = markPriceKlineData.map((kline) => Number(kline[3]));
  const closePrices = markPriceKlineData.map((kline) => Number(kline[4]));
  return heikinashi({
    open: openPrices,
    high: highPrices,
    low: lowPrices,
    close: closePrices
  });
};

const getPrecisionBySize = (size) => {
  if (size === "1") {
    return 0;
  } else {
    return size.indexOf("1") - 1;
  }
};

export const formatBySize = (number, size) => {
  const precision = getPrecisionBySize(size);
  return Number(number.toFixed(precision));
};
