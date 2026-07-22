import { describe, expect, it } from "vitest";
import { createSeedState } from "@/lib/data/seed";
import { applyDashboardAction } from "@/lib/data/mutations";
import { filterPositions, createLeaderboard } from "@/lib/data/selectors";
import { hasPermission } from "@/lib/data/permissions";
import { defaultFilters } from "@/lib/data/types";
import { buildCandidatePayload, validateCandidatePayload } from "@/lib/data/candidate-entry";
import { resolveRecruiterId } from "@/lib/data/recruiters";
import { getRoundEligibleCandidates } from "@/lib/data/interview-candidates";

describe("dashboard data", () => {
  it("respects role permissions", () => {
    expect(hasPermission("admin", "manage_users")).toBe(true);
    expect(hasPermission("recruiter", "manage_users")).toBe(false);
  });

  it("filters positions by client", () => {
    const state = createSeedState();
    const filtered = filterPositions(state, { ...defaultFilters, clientId: "client-1" });
    expect(filtered.every((position) => position.clientId === "client-1")).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it("applies interview updates and logs activity", () => {
    const state = createSeedState();
    const nextState = applyDashboardAction(state, {
      kind: "update-interview",
      interviewId: "int-1",
      status: "L2 Done",
      remarks: "Feedback submitted",
      actorName: "Operations Admin",
    });

    expect(nextState.interviews.find((item) => item.id === "int-1")?.status).toBe("L2 Done");
    expect(nextState.activityLog[0].description).toContain("L2 Done");
  });

  it("cascades dependent records when deleting a position", () => {
    const state = createSeedState();
    const nextState = applyDashboardAction(state, {
      kind: "delete-position",
      positionId: "pos-1",
      actorName: "Operations Admin",
    });

    expect(nextState.positions.some((item) => item.id === "pos-1")).toBe(false);
    expect(nextState.candidates.some((item) => item.positionId === "pos-1")).toBe(false);
    expect(nextState.interviews.some((item) => item.positionId === "pos-1")).toBe(false);
    expect(nextState.offers.some((item) => item.positionId === "pos-1")).toBe(false);
    expect(nextState.joinings.some((item) => item.positionId === "pos-1")).toBe(false);
  });

  it("builds a recruiter leaderboard", () => {
    const state = createSeedState();
    const leaderboard = createLeaderboard(state, defaultFilters);
    expect(leaderboard.length).toBe(state.recruiters.length);
    expect(leaderboard[0].achievement).toBeGreaterThanOrEqual(leaderboard.at(-1)?.achievement ?? 0);
  });

  it("advances candidate stage when adding an interview", () => {
    const state = createSeedState();
    const nextState = applyDashboardAction(state, {
      kind: "add-interview",
      interview: {
        candidateId: "cand-5",
        positionId: "pos-1",
        clientId: "client-1",
        recruiterId: "rec-1",
        interviewDate: "2026-07-11",
        time: "10:00 AM",
        round: "L1",
        status: "L1 Scheduled",
        feedbackDue: "2026-07-13",
        remarks: "",
      },
      actorName: "Aman Singh",
    });

    expect(nextState.candidates.find((item) => item.id === "cand-5")?.stage).toBe("Interview");
  });

  it("builds valid candidate payloads from position context", () => {
    const state = createSeedState();
    const position = state.positions[0];
    const payload = buildCandidatePayload({ name: "Test Candidate" }, position, "rec-1");
    expect(payload.clientId).toBe(position.clientId);
    expect(payload.spocId).toBe(position.spocId);
    expect(validateCandidatePayload(payload)).toBeNull();
  });

  it("resolves recruiter id by email", () => {
    const state = createSeedState();
    expect(resolveRecruiterId(state.recruiters, "chandan.sah@huntsmenbarons.com")).toBe("rec-admin");
  });

  it("lists L1 candidates from recruiter submissions for a position", () => {
    const state = createSeedState();
    const eligible = getRoundEligibleCandidates(
      state.candidates,
      state.interviews,
      "pos-1",
      "L1",
      "rec-1"
    );
    expect(eligible.some((candidate) => candidate.id === "cand-5")).toBe(true);
    expect(eligible.every((candidate) => candidate.stage === "CV Submitted")).toBe(true);
  });

  it("lists L2 candidates after L1 select for a position", () => {
    const state = createSeedState();
    const eligible = getRoundEligibleCandidates(
      state.candidates,
      state.interviews,
      "pos-3",
      "L2",
      "rec-3"
    );
    expect(eligible.some((candidate) => candidate.id === "cand-3")).toBe(true);
  });
});
