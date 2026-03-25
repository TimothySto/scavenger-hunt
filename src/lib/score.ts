/**
 * Shared score computation — accounts for checkpoint check-ins
 * and any manual point adjustments applied by an admin.
 */

type CheckInWithPoints = {
  checkpoint: { points: number; type: string }
}

type Adjustment = {
  points: number
}

export function computeScore(
  checkIns: CheckInWithPoints[],
  adjustments: Adjustment[]
): number {
  const checkpointScore = checkIns
    .filter((ci) => ci.checkpoint.type !== 'PRIZE_REDEMPTION')
    .reduce((sum, ci) => sum + ci.checkpoint.points, 0)

  const adjustmentScore = adjustments.reduce((sum, a) => sum + a.points, 0)

  return checkpointScore + adjustmentScore
}
