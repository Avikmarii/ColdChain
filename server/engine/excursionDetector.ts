/**
 * Server Excursion Detector
 */

export function detectExcursions(
  series: Array<{ tMin: number; tempC: number }>,
  limits: { minC: number; maxC: number }
) {
  if (!series || series.length === 0) {
    return {
      excursions: [],
      maxC: 0,
      minC: 0,
      minutesOutOfRange: 0,
      constraintStatus: "not_evaluated" as const,
      riskLevel: "low" as const
    };
  }

  const { minC, maxC } = limits;
  let maxObserved = -Infinity;
  let minObserved = Infinity;
  let minutesOutOfRange = 0;

  const excursions: Array<{ startMin: number; endMin: number; peakC: number }> = [];
  let currentExcursion: { startMin: number; endMin: number; peakC: number } | null = null;

  for (let i = 0; i < series.length; i++) {
    const pt = series[i];
    const prevPt = i > 0 ? series[i - 1] : null;
    const stepDuration = prevPt ? pt.tMin - prevPt.tMin : 0;

    if (pt.tempC > maxObserved) maxObserved = pt.tempC;
    if (pt.tempC < minObserved) minObserved = pt.tempC;

    const isBreached = pt.tempC > maxC || pt.tempC < minC;

    if (isBreached) {
      minutesOutOfRange += stepDuration;

      if (!currentExcursion) {
        currentExcursion = {
          startMin: pt.tMin,
          endMin: pt.tMin,
          peakC: pt.tempC
        };
      } else {
        currentExcursion.endMin = pt.tMin;
        if (pt.tempC > currentExcursion.peakC) {
          currentExcursion.peakC = pt.tempC;
        }
      }
    } else {
      if (currentExcursion) {
        excursions.push({
          startMin: currentExcursion.startMin,
          endMin: currentExcursion.endMin,
          peakC: Math.round(currentExcursion.peakC * 10) / 10
        });
        currentExcursion = null;
      }
    }
  }

  if (currentExcursion) {
    excursions.push({
      startMin: currentExcursion.startMin,
      endMin: currentExcursion.endMin,
      peakC: Math.round(currentExcursion.peakC * 10) / 10
    });
  }

  const roundedMax = Math.round(maxObserved * 10) / 10;
  const roundedMin = Math.round(minObserved * 10) / 10;
  const roundedMinutes = Math.round(minutesOutOfRange);

  const constraintStatus = roundedMinutes === 0 ? "meets" : "fails";

  let riskLevel: "low" | "medium" | "high" = "low";
  if (roundedMinutes > 30 || roundedMax > maxC + 2.0 || roundedMin < minC - 2.0) {
    riskLevel = "high";
  } else if (roundedMinutes > 0 || roundedMax > maxC - 0.5) {
    riskLevel = "medium";
  }

  return {
    excursions,
    maxC: roundedMax,
    minC: roundedMin,
    minutesOutOfRange: roundedMinutes,
    constraintStatus,
    riskLevel
  };
}
