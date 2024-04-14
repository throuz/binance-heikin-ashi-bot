import { getBestResult } from "../backtest/main.js";

let avgVolPeriod = null;
let entryAvgVolFactor = null;
let exitAvgVolFactor = null;
let leverage = null;

export const setDynamicConfig = async () => {
  const bestResult = await getBestResult();
  avgVolPeriod = bestResult.avgVolPeriod;
  entryAvgVolFactor = bestResult.entryAvgVolFactor;
  exitAvgVolFactor = bestResult.exitAvgVolFactor;
  leverage = bestResult.leverage;
  console.log({ avgVolPeriod, entryAvgVolFactor, exitAvgVolFactor, leverage });
};

export const getDynamicConfig = () => {
  return { avgVolPeriod, entryAvgVolFactor, exitAvgVolFactor, leverage };
};
