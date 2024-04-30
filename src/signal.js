import { getCachedHAKlineData, getCachedLTHAKlineData } from "./cached-data.js";

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
  const cachedHAKlineData = await getCachedHAKlineData();
  return cachedHAKlineData[index - 1].volume;
};

const getPrePeriodAvgVol = async ({ index, avgVolPeriod }) => {
  const cachedHAKlineData = await getCachedHAKlineData();
  const volumeArray = cachedHAKlineData.map((kline) => kline.volume);
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
  closeAvgVolFactor
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
      (preHAKlineTrend === "DOWN" && preVolume > weightedCloseAvgVol) ||
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
      (preHAKlineTrend === "UP" && preVolume > weightedCloseAvgVol) ||
      preLTHAKlineTrend === "UP"
    ) {
      return "CLOSE_SHORT";
    }
  }
  return "NONE";
};
