import type { Candidate, Interview, InterviewStatus } from "./types";

function matchesSearch(candidate: Candidate, query: string) {
  if (!query.trim()) return true;
  return candidate.name.toLowerCase().includes(query.trim().toLowerCase());
}

function filterByRecruiter(candidates: Candidate[], recruiterId: string) {
  if (!recruiterId) return candidates;
  return candidates.filter((candidate) => candidate.recruiterId === recruiterId);
}

export function getSubmittedCandidatesForPosition(
  candidates: Candidate[],
  positionId: string,
  recruiterId: string,
  searchQuery = ""
) {
  if (!positionId) return [];

  return filterByRecruiter(candidates, recruiterId)
    .filter((candidate) => candidate.positionId === positionId)
    .filter((candidate) => candidate.stage === "CV Submitted")
    .filter((candidate) => matchesSearch(candidate, searchQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getRoundEligibleCandidates(
  candidates: Candidate[],
  interviews: Interview[],
  positionId: string,
  round: string,
  recruiterId: string,
  searchQuery = ""
) {
  if (!positionId) return [];

  if (round === "L1") {
    return getSubmittedCandidatesForPosition(candidates, positionId, recruiterId, searchQuery);
  }

  const priorRound = round === "L2" ? "L1" : round === "CI" ? "L2" : "";
  const priorStatus: InterviewStatus | null =
    round === "L2" ? "L1 Select" : round === "CI" ? "L2 Select" : null;

  if (!priorRound || !priorStatus) {
    return [];
  }

  const eligibleIds = new Set(
    interviews
      .filter(
        (interview) =>
          interview.positionId === positionId &&
          interview.round === priorRound &&
          interview.status === priorStatus
      )
      .map((interview) => interview.candidateId)
  );

  return filterByRecruiter(candidates, recruiterId)
    .filter((candidate) => eligibleIds.has(candidate.id))
    .filter((candidate) => matchesSearch(candidate, searchQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const DEFAULT_STATUS_BY_ROUND: Record<string, InterviewStatus> = {
  L1: "L1 Scheduled",
  L2: "L2 Scheduled",
  CI: "CI Round Scheduled",
};
