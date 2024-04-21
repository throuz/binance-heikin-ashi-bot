import { getKlineData, getHAKlineData, getLTHAKlineData } from "./helpers.js";

let cachedKlineData = [];
let cachedHAKlineData = [];
let cachedLTHAKlineData = [];

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
