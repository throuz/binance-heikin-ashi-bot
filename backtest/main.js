import { getBacktestResult } from "./src/backtest.js";
import { setHistoryData } from "./history/history.js";
import { SingleBar, Presets } from "cli-progress";
import { getAddedNumber } from "./src/helpers.js";

export const avgVolPeriodSetting = { min: 5, max: 30, step: 1 };
export const entryAvgVolFactorSetting = { min: 0.5, max: 1, step: 0.05 };
export const exitAvgVolFactorSetting = { min: 1, max: 1.5, step: 0.05 };

const getTotalRuns = () => {
  const avgVolPeriodRuns =
    (avgVolPeriodSetting.max - avgVolPeriodSetting.min) /
      avgVolPeriodSetting.step +
    1;
  const entryAvgVolFactorRuns =
    (entryAvgVolFactorSetting.max - entryAvgVolFactorSetting.min) /
      entryAvgVolFactorSetting.step +
    1;
  const exitAvgVolFactorRuns =
    (exitAvgVolFactorSetting.max - exitAvgVolFactorSetting.min) /
      exitAvgVolFactorSetting.step +
    1;
  return avgVolPeriodRuns * entryAvgVolFactorRuns * exitAvgVolFactorRuns;
};

export const getBestResult = async () => {
  const progressBar = new SingleBar({}, Presets.shades_classic);
  progressBar.start(getTotalRuns(), 0);

  await setHistoryData();

  let bestResult = { fund: 0 };

  for (
    let avgVolPeriod = avgVolPeriodSetting.min;
    avgVolPeriod <= avgVolPeriodSetting.max;
    avgVolPeriod = getAddedNumber(avgVolPeriod, avgVolPeriodSetting.step, 0)
  ) {
    for (
      let entryAvgVolFactor = entryAvgVolFactorSetting.min;
      entryAvgVolFactor <= entryAvgVolFactorSetting.max;
      entryAvgVolFactor = getAddedNumber(
        entryAvgVolFactor,
        entryAvgVolFactorSetting.step,
        2
      )
    ) {
      for (
        let exitAvgVolFactor = exitAvgVolFactorSetting.min;
        exitAvgVolFactor <= exitAvgVolFactorSetting.max;
        exitAvgVolFactor = getAddedNumber(
          exitAvgVolFactor,
          exitAvgVolFactorSetting.step,
          2
        )
      ) {
        const backtestResult = getBacktestResult({
          shouldLogResults: false,
          startIndex: avgVolPeriodSetting.max,
          avgVolPeriod: avgVolPeriod,
          entryAvgVolFactor: entryAvgVolFactor,
          exitAvgVolFactor: exitAvgVolFactor,
          leverage: 1
        });
        if (backtestResult && backtestResult.fund > bestResult.fund) {
          bestResult = backtestResult;
        }
        progressBar.increment();
      }
    }
  }

  for (let i = 1; i < 100; i++) {
    const backtestResult = getBacktestResult({
      shouldLogResults: false,
      startIndex: avgVolPeriodSetting.max,
      avgVolPeriod: bestResult.avgVolPeriod,
      entryAvgVolFactor: bestResult.entryAvgVolFactor,
      exitAvgVolFactor: bestResult.exitAvgVolFactor,
      leverage: i
    });
    if (backtestResult) {
      bestResult = backtestResult;
    } else {
      break;
    }
  }

  progressBar.stop();

  return bestResult;
};
