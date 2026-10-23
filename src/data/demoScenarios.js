export const DEFAULT_SCENARIO = {
  extraDelayMin: 0,
  ambientC: 32,
  coolingInterruptionMin: 0,
  isInterrupted: false,
  insulationPreset: "Moderate"
};

export const GOLDEN_SCENARIO_FIXTURE = {
  routeId: "route-a",
  baseline: {
    travelTimeMin: 180,
    maxC: 7.2,
    hasExcursion: false
  },
  modified: {
    extraDelayMin: 30,
    ambientC: 35,
    coolingInterruptionMin: 45,
    travelTimeMin: 210,
    maxC: 10.5,
    hasExcursion: true,
    excursionDurationMin: 25
  }
};
