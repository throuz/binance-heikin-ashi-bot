import { getBacktestResult, getBestResult } from "./src/backtest.js";

const bestResult = await getBestResult();
const { fund, avgVolPeriod, openAvgVolFactor, closeAvgVolFactor, leverage } =
  bestResult;
console.log("================================================================");
await getBacktestResult({
  shouldLogResults: true,
  avgVolPeriod,
  openAvgVolFactor,
  closeAvgVolFactor,
  leverage
});
console.log("================================================================");
console.log("fund", fund);
console.log("avgVolPeriod", avgVolPeriod);
console.log("openAvgVolFactor", openAvgVolFactor);
console.log("closeAvgVolFactor", closeAvgVolFactor);
console.log("leverage", leverage);
