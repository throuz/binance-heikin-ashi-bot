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

const getWeightedPrePeriodAvgVol = async ({
  index,
  avgVolPeriod,
  openAvgVolFactor,
  closeAvgVolFactor
}) => {
  const cachedHAKlineData = await getCachedHAKlineData();
  const preHAKlineTrend = await getPreHAKlineTrend(index);
  const volumeArray = cachedHAKlineData.map((kline) => kline.volume);
  const prePeriodSumVolume = volumeArray
    .slice(index - avgVolPeriod, index)
    .reduce((acc, volume) => acc + volume, 0);
  const prePeriodAvgVol = prePeriodSumVolume / avgVolPeriod;
  if (preHAKlineTrend === "UP") {
    return prePeriodAvgVol * openAvgVolFactor;
  }
  if (preHAKlineTrend === "DOWN") {
    return prePeriodAvgVol * closeAvgVolFactor;
  }
  return prePeriodAvgVol;
};

export const getSignal = async ({
  hasPosition,
  index,
  avgVolPeriod,
  openAvgVolFactor,
  closeAvgVolFactor
}) => {
  const preHAKlineTrend = await getPreHAKlineTrend(index);
  const preLTHAKlineTrend = await getPreLTHAKlineTrend(index);
  const preVolume = await getPreVolume(index);
  const weightedPrePeriodAvgVol = await getWeightedPrePeriodAvgVol({
    index,
    avgVolPeriod,
    openAvgVolFactor,
    closeAvgVolFactor
  });
  if (!hasPosition) {
    if (
      preHAKlineTrend === "UP" &&
      preVolume < weightedPrePeriodAvgVol &&
      preLTHAKlineTrend === "UP"
    ) {
      return "OPEN";
    }
  }
  if (hasPosition) {
    if (
      (preHAKlineTrend === "DOWN" && preVolume > weightedPrePeriodAvgVol) ||
      preLTHAKlineTrend === "DOWN"
    ) {
      return "CLOSE";
    }
  }
  return "NONE";
};
