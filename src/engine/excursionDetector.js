/**
 * Excursion Detector
 * Evaluates simulated time-temperature series against configured product limits.
 * Identifies breach intervals, calculates cumulative duration outside range,
 * and determines constraint status and thermal risk classification.
 */

export function detectExcursions(series, limits) {
  if (!series || series.length === 0) {
    return {
      excursions: [],
      maxC: 0,
      minC: 0,
      minutesOutOfRange: 0,
      constraintStatus: "not_evaluated",
      riskLevel: "low"
    };
  }

  const { minC, maxC } = limits;
  let maxObserved = -Infinity;
  let minObserved = Infinity;
  let minutesOutOfRange = 0;

  const excursions = [];
  let currentExcursion = null;

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

  // Rounded metrics
  const roundedMax = Math.round(maxObserved * 10) / 10;
  const roundedMin = Math.round(minObserved * 10) / 10;
  const roundedMinutes = Math.round(minutesOutOfRange);

  // Constraint status: "meets" | "fails"
  const constraintStatus = roundedMinutes === 0 ? "meets" : "fails";

  // Thermal Risk Classification
  let riskLevel = "low";
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
