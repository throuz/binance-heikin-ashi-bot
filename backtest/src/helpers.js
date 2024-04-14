import {
  SYMBOL,
  KLINE_INTERVAL,
  KLINE_LIMIT,
  KLINE_START_TIME,
  KLINE_END_TIME,
  FUNDING_RATE
} from "../config/config.js";
import { klineDataAPI, markPriceKlineDataAPI } from "./api.js";
import { heikinashi } from "technicalindicators";
import { getHistoryData } from "../history/history.js";

export const getKlineData = async () => {
  const params = {
    symbol: SYMBOL,
    interval: KLINE_INTERVAL,
    limit: KLINE_LIMIT,
    startTime: KLINE_START_TIME,
    endTime: KLINE_END_TIME
  };
  const klineData = await klineDataAPI(params);
  const results = klineData.map((kline) => ({
    openPrice: Number(kline[1]),
    highPrice: Number(kline[2]),
    lowPrice: Number(kline[3]),
    closePrice: Number(kline[4]),
    volume: Number(kline[5]),
    openTime: kline[0],
    closeTime: kline[6]
  }));
  return results;
};

export const getPrePeriodAvgVol = (i, avgVolPeriod) => {
  const { klineData } = getHistoryData();
  const volumeArray = klineData.map((kline) => kline.volume);
  const prevPeriodSumVolume = volumeArray
    .slice(i - avgVolPeriod, i)
    .reduce((acc, volume) => acc + volume, 0);
  const prePeriodAvgVol = prevPeriodSumVolume / avgVolPeriod;
  return prePeriodAvgVol;
};

export const getHeikinAshiKlineData = async (interval = KLINE_INTERVAL) => {
  const params = {
    symbol: SYMBOL,
    interval: interval,
    limit: KLINE_LIMIT,
    startTime: KLINE_START_TIME,
    endTime: KLINE_END_TIME
  };
  const markPriceKlineData = await markPriceKlineDataAPI(params);
  const openPrices = markPriceKlineData.map((kline) => Number(kline[1]));
  const highPrices = markPriceKlineData.map((kline) => Number(kline[2]));
  const lowPrices = markPriceKlineData.map((kline) => Number(kline[3]));
  const closePrices = markPriceKlineData.map((kline) => Number(kline[4]));
  const heikinashiResults = heikinashi({
    open: openPrices,
    high: highPrices,
    low: lowPrices,
    close: closePrices
  });
  const results = markPriceKlineData.map((kline, i) => ({
    openPrice: heikinashiResults.open[i],
    highPrice: heikinashiResults.high[i],
    lowPrice: heikinashiResults.low[i],
    closePrice: heikinashiResults.close[i],
    openTime: kline[0],
    closeTime: kline[6]
  }));
  return results;
};

export const getPreLongTermTrend = (timestamp) => {
  const { longTermHeikinAshiKlineData } = getHistoryData();
  for (let i = 1; i < longTermHeikinAshiKlineData.length; i++) {
    const prevData = longTermHeikinAshiKlineData[i - 1];
    const curData = longTermHeikinAshiKlineData[i];
    if (timestamp >= curData.openTime && timestamp <= curData.closeTime) {
      return prevData.closePrice > prevData.openPrice ? "up" : "down";
    }
  }
  return null;
};

export const getFundingFeeTimes = (startTimeStamp, endTimeStamp) => {
  const timeDifference = endTimeStamp - startTimeStamp;
  const hours = timeDifference / (1000 * 60 * 60);
  const times = Math.floor(hours / 8);
  return times;
};

export const getFundingFee = (positionFund, startTimeStamp, endTimeStamp) => {
  const times = getFundingFeeTimes(startTimeStamp, endTimeStamp);
  const fundingFee = positionFund * FUNDING_RATE * times;
  return fundingFee;
};

const getDaysBetweenTimestamp = (startTimestamp, endTimeStamp) => {
  const timeDifference = endTimeStamp - startTimestamp;
  const oneDayMs = 1000 * 60 * 60 * 24;
  const days = timeDifference / oneDayMs;
  return days;
};

export const getDailyPNLPercentage = (
  PNLPercentage,
  startTimestamp,
  endTimeStamp
) => {
  const days = getDaysBetweenTimestamp(startTimestamp, endTimeStamp);
  const dailyPNLPercentage =
    (Math.pow(1 + PNLPercentage / 100, 1 / days) - 1) * 100;
  return dailyPNLPercentage;
};

const convertTwoDigitFormat = (number) => {
  if (number < 10) {
    return "0" + String(number);
  }
  return String(number);
};

export const getFormattedTime = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = convertTwoDigitFormat(date.getMonth() + 1);
  const day = convertTwoDigitFormat(date.getDate());
  const hours = convertTwoDigitFormat(date.getHours());
  const minutes = convertTwoDigitFormat(date.getMinutes());
  const seconds = convertTwoDigitFormat(date.getSeconds());
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedTime;
};

export const getAddedNumber = (number, addNumber, digit) => {
  return Number((number + addNumber).toFixed(digit));
};
