type CalculatePointsParams = {
  predictedHome: number;
  predictedAway: number;
  realHome: number | null;
  realAway: number | null;
  finished: boolean;
};

function getResult(home: number, away: number) {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

export function calculatePoints({
  predictedHome,
  predictedAway,
  realHome,
  realAway,
  finished,
}: CalculatePointsParams) {
  if (!finished || realHome === null || realAway === null) {
    return 0;
  }

  const exactScore =
    predictedHome === realHome && predictedAway === realAway;

  if (exactScore) {
    return 5;
  }

  const predictedResult = getResult(predictedHome, predictedAway);
  const realResult = getResult(realHome, realAway);

  if (predictedResult === realResult) {
    return 3;
  }

  return 0;
}