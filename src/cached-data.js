import { getKlineData, getHAKlineData, getLTHAKlineData } from "./helpers.js";
import { AVG_VOL_PERIOD_SETTING } from "../configs/trade-config.js";

let cachedKlineData = [];
let cachedHAKlineData = [];
let cachedLTHAKlineData = [];
let cachedUsefulData = [];

const shouldGetLatestData = (data) => {
  const noCachedData = data.length === 0;
  const isCachedDataExpired =
    data.length > 0 && Date.now() > data[data.length - 1].closeTime;
  return noCachedData || isCachedDataExpired;
};

export const getCachedKlineData = async () => {
  if (shouldGetLatestData(cachedKlineData)) {
    const klineData = await getKlineData();
    cachedKlineData = klineData;
  }
  return cachedKlineData;
};

export const getCachedHAKlineData = async () => {
  if (shouldGetLatestData(cachedHAKlineData)) {
    const klineData = await getHAKlineData();
    cachedHAKlineData = klineData;
  }
  return cachedHAKlineData;
};

export const getCachedLTHAKlineData = async () => {
  if (shouldGetLatestData(cachedLTHAKlineData)) {
    const klineData = await getLTHAKlineData();
    cachedLTHAKlineData = klineData;
  }
  return cachedLTHAKlineData;
};

// Get cached useful data functions
const getCurHAOpenPrice = async (index) => {
  const cachedHAKlineData = await getCachedHAKlineData();
  return cachedHAKlineData[index].openPrice;
};

const getCurLTHAOpenPrice = async (index) => {
  const cachedHAKlineData = await getCachedHAKlineData();
  const cachedLTHAKlineData = await getCachedLTHAKlineData();
  const timestamp = cachedHAKlineData[index].openTime;
  const foundIndex = cachedLTHAKlineData.findIndex(
    (kline) => timestamp >= kline.openTime && timestamp <= kline.closeTime
  );
  return cachedLTHAKlineData[foundIndex].openPrice;
};

const getPreHAKlineTrend = async (index) => {
  const cachedHAKlineData = await getCachedHAKlineData();
  const { openPrice, closePrice } = cachedHAKlineData[index - 1];
  return closePrice > openPrice ? "UP" : "DOWN";
};

const getPreLTHAKlineTrend = async (index) => {
  const cachedHAKlineData = await getCachedHAKlineData();
  const cachedLTHAKlineData = await getCachedLTHAKlineData();
  const timestamp = cachedHAKlineData[index].openTime;
  const foundIndex = cachedLTHAKlineData.findIndex(
    (kline) => timestamp >= kline.openTime && timestamp <= kline.closeTime
  );
  const { openPrice, closePrice } = cachedLTHAKlineData[foundIndex - 1];
  return closePrice > openPrice ? "UP" : "DOWN";
};

const getPreVolume = async (index) => {
  const cachedKlineData = await getCachedKlineData();
  return cachedKlineData[index - 1].volume;
};

export const getCachedUsefulData = async () => {
  if (shouldGetLatestData(cachedUsefulData)) {
    const results = new Array(AVG_VOL_PERIOD_SETTING.max).fill(null);
    const cachedKlineData = await getCachedKlineData();
    for (let i = AVG_VOL_PERIOD_SETTING.max; i < cachedKlineData.length; i++) {
      const [
        curHAOpenPrice,
        curLTHAOpenPrice,
        preHAKlineTrend,
        preLTHAKlineTrend,
        preVolume
      ] = await Promise.all([
        getCurHAOpenPrice(i),
        getCurLTHAOpenPrice(i),
        getPreHAKlineTrend(i),
        getPreLTHAKlineTrend(i),
        getPreVolume(i)
      ]);
      results[i] = {
        curHAOpenPrice,
        curLTHAOpenPrice,
        preHAKlineTrend,
        preLTHAKlineTrend,
        preVolume,
        closeTime: cachedKlineData[i].closeTime
      };
      cachedUsefulData = results;
    }
  }
  return cachedUsefulData;
};
