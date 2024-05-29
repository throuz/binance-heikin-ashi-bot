import { getCachedHAKlineData, getCachedLTHAKlineData } from "./cached-data.js";

const getPreHAKlineTrend = async (index) => {
  const cachedKlineData = await getCachedHAKlineData();
  const { openPrice, closePrice } = cachedKlineData[index - 1];
  return closePrice > openPrice ? "UP" : "DOWN";
};

const getPreLTHAKlineTrend = async (index) => {
  const cachedKlineData = await getCachedHAKlineData();
  const cachedLTHAKlineData = await getCachedLTHAKlineData();
  const timestamp = cachedKlineData[index].openTime;
  const foundIndex = cachedLTHAKlineData.findIndex(
    (kline) => timestamp >= kline.openTime && timestamp <= kline.closeTime
  );
  const { openPrice, closePrice } = cachedLTHAKlineData[foundIndex - 1];
  return closePrice > openPrice ? "UP" : "DOWN";
};

const getPreVolume = async (index) => {
  const cachedKlineData = await getCachedHAKlineData();
  return cachedKlineData[index - 1].volume;
};

const getPrePeriodAvgVol = async ({ index, avgVolPeriod }) => {
  const cachedKlineData = await getCachedHAKlineData();
  const volumeArray = cachedKlineData.map((kline) => kline.volume);
  const prePeriodSumVolume = volumeArray
    .slice(index - avgVolPeriod, index)
    .reduce((acc, volume) => acc + volume, 0);
  const prePeriodAvgVol = prePeriodSumVolume / avgVolPeriod;
  return prePeriodAvgVol;
};

export const getSignal = async ({
  positionType,
  index,
  avgVolPeriod,
  openAvgVolFactor,
  closeAvgVolFactor,
  isUnRealizedProfit
}) => {
  const preHAKlineTrend = await getPreHAKlineTrend(index);
  const preLTHAKlineTrend = await getPreLTHAKlineTrend(index);
  const preVolume = await getPreVolume(index);
  const prePeriodAvgVol = await getPrePeriodAvgVol({
    index,
    avgVolPeriod
  });
  const weightedOpenAvgVol = prePeriodAvgVol * openAvgVolFactor;
  const weightedCloseAvgVol = prePeriodAvgVol * closeAvgVolFactor;
  // OPEN_LONG
  if (positionType === "NONE") {
    if (
      preHAKlineTrend === "UP" &&
      preVolume < weightedOpenAvgVol &&
      preLTHAKlineTrend === "UP"
    ) {
      return "OPEN_LONG";
    }
  }
  // CLOSE_LONG
  if (positionType === "LONG") {
    if (
      (preVolume > weightedCloseAvgVol && isUnRealizedProfit) ||
      preLTHAKlineTrend === "DOWN"
    ) {
      return "CLOSE_LONG";
    }
  }
  // OPEN_SHORT
  if (positionType === "NONE") {
    if (
      preHAKlineTrend === "DOWN" &&
      preVolume < weightedOpenAvgVol &&
      preLTHAKlineTrend === "DOWN"
    ) {
      return "OPEN_SHORT";
    }
  }
  // CLOSE_SHORT
  if (positionType === "SHORT") {
    if (
      (preVolume > weightedCloseAvgVol && isUnRealizedProfit) ||
      preLTHAKlineTrend === "UP"
    ) {
      return "CLOSE_SHORT";
    }
  }
  return "NONE";
};
