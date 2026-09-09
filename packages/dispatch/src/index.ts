export type Candidate = {
  driverId: string;
  vehicleId: string;
  distanceKm: number;
};

export function rankCandidates(
  candidates: Candidate[],
): Candidate[] {
  return [...candidates].sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );
}
