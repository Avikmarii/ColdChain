/**
 * Mean Kinetic Temperature (MKT) and Thermal Excursion Evaluation Utility
 * Compliant with USP <1079>, WHO TRS 961 Annex 9, and ICH Guidelines.
 *
 * MKT formula:
 * Tk = (dH / R) / -ln( (1/n) * sum( exp( -(dH / R) / Ti ) ) )
 * where:
 *   dH / R = 10,000 K (standard activation energy 83.144 kJ/mol divided by universal gas constant R 8.3144 J/(mol*K))
 *   Ti = Temperature in Kelvin (C + 273.15)
 */

export const DH_OVER_R = 10000; // Kelvins

/**
 * Calculates the Mean Kinetic Temperature (MKT) in Celsius.
 * @param {number[]} temperatures - Array of Celsius temperature readings
 * @returns {number|null} MKT in Celsius, rounded to 2 decimal places, or null if empty
 */
export function calculateMKT(temperatures) {
  if (!temperatures || !Array.isArray(temperatures) || temperatures.length === 0) {
    return null;
  }

  // Filter valid numbers
  const valid = temperatures.filter((t) => typeof t === "number" && !isNaN(t));
  if (valid.length === 0) return null;
  if (valid.length === 1) return Number(valid[0].toFixed(2));

  let expSum = 0;
  for (let i = 0; i < valid.length; i++) {
    const kelvin = valid[i] + 273.15;
    if (kelvin <= 0) continue; // absolute zero guard
    expSum += Math.exp(-DH_OVER_R / kelvin);
  }

  const avgExp = expSum / valid.length;
  if (avgExp <= 0) return null;

  const mktKelvin = DH_OVER_R / -Math.log(avgExp);
  const mktCelsius = mktKelvin - 273.15;

  return Number(mktCelsius.toFixed(2));
}

/**
 * Evaluates telemetry readings against configured limits.
 * @param {Array<{ timestamp: string, tempC: number }>} telemetryPoints - Chronological readings
 * @param {{ minC: number, maxC: number }} limits - Configured allowable range (default 2°C - 8°C)
 * @param {number} intervalMinutes - Reading interval in minutes (default: 15)
 */
export function evaluateThermalIntegrity(telemetryPoints = [], limits = { minC: 2.0, maxC: 8.0 }, intervalMinutes = 15) {
  if (!telemetryPoints || telemetryPoints.length === 0) {
    return {
      hasData: false,
      readingCount: 0,
      minTemp: null,
      maxTemp: null,
      avgTemp: null,
      mkt: null,
      excursionMinutes: 0,
      excursions: [],
      complianceStatus: "NOT_EVALUATED",
      complianceLabel: "Not yet evaluated",
      provenance: "demo-simulated"
    };
  }

  const temps = telemetryPoints.map((p) => p.tempC).filter((t) => typeof t === "number" && !isNaN(t));

  if (temps.length === 0) {
    return {
      hasData: false,
      readingCount: 0,
      minTemp: null,
      maxTemp: null,
      avgTemp: null,
      mkt: null,
      excursionMinutes: 0,
      excursions: [],
      complianceStatus: "NOT_EVALUATED",
      complianceLabel: "Not yet evaluated",
      provenance: "demo-simulated"
    };
  }

  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const sum = temps.reduce((a, b) => a + b, 0);
  const avgTemp = Number((sum / temps.length).toFixed(2));
  const mkt = calculateMKT(temps);

  const minLimit = limits.minC ?? 2.0;
  const maxLimit = limits.maxC ?? 8.0;

  // Detect continuous excursion blocks
  const excursions = [];
  let currentExcursion = null;

  for (let i = 0; i < telemetryPoints.length; i++) {
    const point = telemetryPoints[i];
    const t = point.tempC;
    const isHigh = t > maxLimit;
    const isLow = t < minLimit;

    if (isHigh || isLow) {
      if (!currentExcursion) {
        currentExcursion = {
          type: isHigh ? "HIGH" : "LOW",
          startTime: point.timestamp,
          endTime: point.timestamp,
          peakTemp: t,
          pointCount: 1,
          durationMinutes: intervalMinutes
        };
      } else {
        currentExcursion.pointCount += 1;
        currentExcursion.durationMinutes = currentExcursion.pointCount * intervalMinutes;
        currentExcursion.endTime = point.timestamp;
        if (isHigh && t > currentExcursion.peakTemp) currentExcursion.peakTemp = t;
        if (isLow && t < currentExcursion.peakTemp) currentExcursion.peakTemp = t;
      }
    } else {
      if (currentExcursion) {
        excursions.push(currentExcursion);
        currentExcursion = null;
      }
    }
  }

  if (currentExcursion) {
    excursions.push(currentExcursion);
  }

  const totalExcursionMinutes = excursions.reduce((acc, exc) => acc + exc.durationMinutes, 0);
  const meetsLimits = excursions.length === 0 && mkt >= minLimit && mkt <= maxLimit;

  return {
    hasData: true,
    readingCount: temps.length,
    minTemp: Number(minTemp.toFixed(1)),
    maxTemp: Number(maxTemp.toFixed(1)),
    avgTemp,
    mkt,
    excursionMinutes: totalExcursionMinutes,
    excursions,
    complianceStatus: meetsLimits ? "COMPLIANT" : "EXCURSION_RECORDED",
    complianceLabel: meetsLimits
      ? "Meets configured limits in this simulation"
      : `${totalExcursionMinutes} min excursion recorded`,
    provenance: "demo-simulated"
  };
}
