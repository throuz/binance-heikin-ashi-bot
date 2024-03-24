import {
  LONG_TERM_KLINE_INTERVAL,
  AVERAGE_VOLUME_PERIOD,
  AVERAGE_VOLUME_THRESHOLD_FACTOR
} from "../configs/trade-config.js";
import { getKlineData, getHeikinAshiKlineData } from "./helpers.js";

// Open conditions

const getIsPrevKlineUpward = async () => {
  const { open, close } = await getHeikinAshiKlineData();
  return close[close.length - 2] > open[open.length - 2];
};

const getIsPrevVolumeBelowAverage = async () => {
  const klineData = await getKlineData();
  const volumeArray = klineData.map((kline) => Number(kline[5]));
  const previousVolume = volumeArray[volumeArray.length - 2];
  const recentVolumeArray = volumeArray.slice(-AVERAGE_VOLUME_PERIOD - 1, -1);
  const sumVolume = recentVolumeArray.reduce((acc, volume) => volume + acc, 0);
  const averageVolume = sumVolume / AVERAGE_VOLUME_PERIOD;
  return previousVolume < averageVolume * (1 - AVERAGE_VOLUME_THRESHOLD_FACTOR);
};

const getIsPrevLongTermKlineUpward = async () => {
  const { open, close } = await getHeikinAshiKlineData(
    LONG_TERM_KLINE_INTERVAL
  );
  return close[close.length - 2] > open[open.length - 2];
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsPrevKlineUpward(),
    getIsPrevVolumeBelowAverage(),
    getIsPrevLongTermKlineUpward()
  ]);
  return results.every((result) => result);
};

// Close conditions

const getIsPrevKlineDownward = async () => {
  const { open, close } = await getHeikinAshiKlineData();
  return close[close.length - 2] < open[open.length - 2];
};

const getIsPrevVolumeAboveAverage = async () => {
  const klineData = await getKlineData();
  const volumeArray = klineData.map((kline) => Number(kline[5]));
  const previousVolume = volumeArray[volumeArray.length - 2];
  const recentVolumeArray = volumeArray.slice(-AVERAGE_VOLUME_PERIOD - 1, -1);
  const sumVolume = recentVolumeArray.reduce((acc, volume) => volume + acc, 0);
  const averageVolume = sumVolume / AVERAGE_VOLUME_PERIOD;
  return previousVolume > averageVolume * (1 + AVERAGE_VOLUME_THRESHOLD_FACTOR);
};

const getIsPrevLongTermKlineDownward = async () => {
  const { open, close } = await getHeikinAshiKlineData(
    LONG_TERM_KLINE_INTERVAL
  );
  return close[close.length - 2] < open[open.length - 2];
};

export const getIsCloseConditionsMet = async () => {
  const [
    isPrevKlineDownward,
    isPrevVolumeAboveAverage,
    isPrevLongTermKlineDownward
  ] = await Promise.all([
    getIsPrevKlineDownward(),
    getIsPrevVolumeAboveAverage(),
    getIsPrevLongTermKlineDownward()
  ]);
  return (
    (isPrevKlineDownward && isPrevVolumeAboveAverage) ||
    isPrevLongTermKlineDownward
  );
};
