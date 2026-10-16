export const ELIGIBILITY_KWH_PER_KW_THRESHOLD = 1100;

export type Eligibility = "eligible" | "not_eligible" | "unknown";

export function getEligibility(kwhPerKw: number | null | undefined): Eligibility {
  if (kwhPerKw == null) return "unknown";
  return kwhPerKw >= ELIGIBILITY_KWH_PER_KW_THRESHOLD ? "eligible" : "not_eligible";
}
