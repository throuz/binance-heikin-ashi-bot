import { getBacktestResult } from "./src/backtest.js";
import { avgVolPeriodSetting, getBestResult } from "./main.js";

const bestResult = await getBestResult();
const {
  fund,
  highestFund,
  avgVolPeriod,
  entryAvgVolFactor,
  exitAvgVolFactor,
  leverage
} = bestResult;
console.log("================================================================");
getBacktestResult({
  shouldLogResults: true,
  startIndex: avgVolPeriodSetting.max,
  avgVolPeriod,
  entryAvgVolFactor,
  exitAvgVolFactor,
  leverage
});
console.log("================================================================");
console.log("fund", fund);
console.log("highestFund", highestFund);
console.log("avgVolPeriod", avgVolPeriod);
console.log("entryAvgVolFactor", entryAvgVolFactor);
console.log("exitAvgVolFactor", exitAvgVolFactor);
console.log("leverage", leverage);
