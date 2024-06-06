import { getCachedKlineData, getCachedUsefulData } from "./cached-data.js";

const getPrePeriodAvgVol = async ({ index, avgVolPeriod }) => {
  const cachedKlineData = await getCachedKlineData();
  let prePeriodSumVolume = 0;
  for (let i = index - avgVolPeriod; i < index; i++) {
    prePeriodSumVolume += cachedKlineData[i].volume;
  }
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
  const cachedUsefulData = await getCachedUsefulData();
  const {
    curHAOpenPrice,
    curLTHAOpenPrice,
    preHAKlineTrend,
    preLTHAKlineTrend,
    preVolume
  } = cachedUsefulData[index];
  const prePeriodAvgVol = await getPrePeriodAvgVol({ index, avgVolPeriod });
  const weightedOpenAvgVol = prePeriodAvgVol * openAvgVolFactor;
  const weightedCloseAvgVol = prePeriodAvgVol * closeAvgVolFactor;
  // OPEN_LONG
  if (positionType === "NONE") {
    if (
      preHAKlineTrend === "UP" &&
      preVolume < weightedOpenAvgVol &&
      curHAOpenPrice < curLTHAOpenPrice &&
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
      curHAOpenPrice > curLTHAOpenPrice &&
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
