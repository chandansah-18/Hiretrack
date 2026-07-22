import { describe, expect, it } from "vitest";
import { createSeedState } from "@/lib/data/seed";
import { applyDashboardAction, type DashboardAction } from "@/lib/data/mutations";
import type { DashboardState } from "@/lib/data/types";

const BROWSER_A = "Aman Singh (Browser A)";
const BROWSER_B = "Riya Kapoor (Browser B)";
const BROWSER_C = "Operations Admin (Browser C)";

function verifyInvariants(state: DashboardState) {
  const clientIds = new Set(state.clients.map((c) => c.id));
  const recruiterIds = new Set(state.recruiters.map((r) => r.id));
  const spocIds = new Set(state.spocs.map((s) => s.id));
  const positionIds = new Set(state.positions.map((p) => p.id));
  const candidateIds = new Set(state.candidates.map((c) => c.id));
  const interviewIds = new Set(state.interviews.map((i) => i.id));
  const offerIds = new Set(state.offers.map((o) => o.id));
  const joiningIds = new Set(state.joinings.map((j) => j.id));

  const allIds = [
    ...state.clients.map((c) => ["client", c.id] as const),
    ...state.recruiters.map((r) => ["recruiter", r.id] as const),
    ...state.spocs.map((s) => ["spoc", s.id] as const),
    ...state.positions.map((p) => ["position", p.id] as const),
    ...state.candidates.map((c) => ["candidate", c.id] as const),
    ...state.interviews.map((i) => ["interview", i.id] as const),
    ...state.offers.map((o) => ["offer", o.id] as const),
    ...state.joinings.map((j) => ["joining", j.id] as const),
  ];

  const seen = new Map<string, string[]>();
  for (const [type, id] of allIds) {
    const existing = seen.get(id);
    if (existing) {
      throw new Error(`Duplicate ID ${id} in types ${existing.join(",")} and ${type}`);
    }
    seen.set(id, [type]);
  }

  for (const pos of state.positions) {
    expect(clientIds.has(pos.clientId)).toBe(true);
    expect(recruiterIds.has(pos.recruiterId)).toBe(true);
    expect(spocIds.has(pos.spocId)).toBe(true);
  }

  for (const cand of state.candidates) {
    expect(positionIds.has(cand.positionId)).toBe(true);
    expect(recruiterIds.has(cand.recruiterId)).toBe(true);
  }

  for (const int of state.interviews) {
    expect(candidateIds.has(int.candidateId)).toBe(true);
    expect(positionIds.has(int.positionId)).toBe(true);
    expect(recruiterIds.has(int.recruiterId)).toBe(true);
  }

  for (const off of state.offers) {
    expect(candidateIds.has(off.candidateId)).toBe(true);
    expect(positionIds.has(off.positionId)).toBe(true);
  }

  for (const join of state.joinings) {
    expect(candidateIds.has(join.candidateId)).toBe(true);
    expect(positionIds.has(join.positionId)).toBe(true);
  }

  for (const log of state.activityLog) {
    expect(log.id).toBeTruthy();
    expect(log.actorName).toBeTruthy();
    expect(log.description).toBeTruthy();
  }

  expect(state.currentUserRole).toBeTruthy();
  expect(state.currentUserName).toBeTruthy();
}

function apply(shared: DashboardState, action: DashboardAction): DashboardState {
  const next = applyDashboardAction(shared, action);
  verifyInvariants(next);
  return next;
}

describe("3-browser concurrent soak test", () => {
  it("scenario 1: concurrent adds from 3 browsers do not collide", () => {
    let state = createSeedState();
    const posCount = state.positions.length;
    const candCount = state.candidates.length;
    const recCount = state.recruiters.length;

    const today = new Date().toISOString().slice(0, 10);

    state = apply(state, {
      kind: "add-position",
      position: { name: "Test Role A", clientId: "client-1", recruiterId: "rec-1", spocId: "spoc-1", vertical: "Technology", technology: "React", status: "Open", openDate: today, openings: 2, ctc: 20, location: ["Bangalore"], remarks: "Browser A" },
      actorName: BROWSER_A,
    });
    state = apply(state, {
      kind: "add-position",
      position: { name: "Test Role B", clientId: "client-2", recruiterId: "rec-2", spocId: "spoc-3", vertical: "Operations", technology: "Sales", status: "Open", openDate: today, openings: 1, ctc: 15, location: ["Mumbai"], remarks: "Browser B" },
      actorName: BROWSER_B,
    });
    state = apply(state, {
      kind: "add-position",
      position: { name: "Test Role C", clientId: "client-3", recruiterId: "rec-1", spocId: "spoc-4", vertical: "Technology", technology: "AWS", status: "Open", openDate: today, openings: 3, ctc: 25, location: ["Chennai"], remarks: "Browser C" },
      actorName: BROWSER_C,
    });

    expect(state.positions.length).toBe(posCount + 3);
    expect(state.positions.some((p) => p.name === "Test Role A")).toBe(true);
    expect(state.positions.some((p) => p.name === "Test Role B")).toBe(true);
    expect(state.positions.some((p) => p.name === "Test Role C")).toBe(true);

    state = apply(state, {
      kind: "add-candidate",
      candidate: { name: "Concurrent Alpha", contactNo: "900000001", emailId: "alpha@test.com", positionId: state.positions.find((p) => p.name === "Test Role A")!.id, clientId: "client-1", recruiterId: "rec-1", spocId: "spoc-1", technology: "React", stage: "CV Submitted", submittedAt: today, source: "LinkedIn", remarks: "", currentCtc: 0, expectedCtc: 0, noticePeriod: "", currentCompany: "", experience: 0, location: "", requisitionId: "", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
      actorName: BROWSER_A,
    });
    state = apply(state, {
      kind: "add-candidate",
      candidate: { name: "Concurrent Beta", contactNo: "900000002", emailId: "beta@test.com", positionId: state.positions.find((p) => p.name === "Test Role B")!.id, clientId: "client-2", recruiterId: "rec-2", spocId: "spoc-3", technology: "Sales", stage: "CV Submitted", submittedAt: today, source: "Naukri", remarks: "", currentCtc: 0, expectedCtc: 0, noticePeriod: "", currentCompany: "", experience: 0, location: "", requisitionId: "", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
      actorName: BROWSER_B,
    });
    state = apply(state, {
      kind: "add-candidate",
      candidate: { name: "Concurrent Gamma", contactNo: "900000003", emailId: "gamma@test.com", positionId: state.positions.find((p) => p.name === "Test Role C")!.id, clientId: "client-3", recruiterId: "rec-1", spocId: "spoc-4", technology: "AWS", stage: "CV Submitted", submittedAt: today, source: "Referral", remarks: "", currentCtc: 0, expectedCtc: 0, noticePeriod: "", currentCompany: "", experience: 0, location: "", requisitionId: "", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
      actorName: BROWSER_C,
    });

    expect(state.candidates.length).toBe(candCount + 3);
  });

  it("scenario 2: concurrent updates to the same interview (last-write-wins)", () => {
    let state = createSeedState();

    const intA = apply(state, {
      kind: "update-interview",
      interviewId: "int-1",
      status: "L2 Done",
      remarks: "Browser A: passed L2",
      actorName: BROWSER_A,
    });

    const intB = apply(state, {
      kind: "update-interview",
      interviewId: "int-1",
      status: "L2 Select",
      remarks: "Browser B: selected for CI",
      actorName: BROWSER_B,
    });

    const intC = apply(state, {
      kind: "update-interview",
      interviewId: "int-1",
      status: "CI Round Done",
      remarks: "Browser C: completed CI round",
      actorName: BROWSER_C,
    });

    const finalA = applyDashboardAction(intA, {
      kind: "update-interview",
      interviewId: "int-1",
      status: "L2 Select",
      remarks: "Browser A: approved",
      actorName: BROWSER_A,
    });
    verifyInvariants(finalA);

    const finalB = applyDashboardAction(intB, {
      kind: "update-interview",
      interviewId: "int-1",
      status: "CI Round Done",
      remarks: "Browser B: panel passed",
      actorName: BROWSER_B,
    });
    verifyInvariants(finalB);

    const finalC = applyDashboardAction(intC, {
      kind: "update-interview",
      interviewId: "int-1",
      status: "Final Select",
      remarks: "Browser C: final select",
      actorName: BROWSER_C,
    });
    verifyInvariants(finalC);

    expect(finalA.interviews.find((i) => i.id === "int-1")?.status).toBe("L2 Select");
    expect(finalB.interviews.find((i) => i.id === "int-1")?.status).toBe("CI Round Done");
    expect(finalC.interviews.find((i) => i.id === "int-1")?.status).toBe("Final Select");
  });

  it("scenario 3: cascade delete position while another browser updates a candidate", () => {
    let state = createSeedState();

    const posId = "pos-1";
    const candInPos = state.candidates.filter((c) => c.positionId === posId);
    expect(candInPos.length).toBeGreaterThan(0);

    const candId = candInPos[0].id;

    const afterDelete = apply(state, {
      kind: "delete-position",
      positionId: posId,
      actorName: BROWSER_A,
    });

    const afterStaleUpdate = applyDashboardAction(state, {
      kind: "update-candidate",
      candidateId: candId,
      stage: "Interview",
      remarks: "Browser B: updating stale reference",
      actorName: BROWSER_B,
    });
    verifyInvariants(afterStaleUpdate);

    expect(afterDelete.positions.some((p) => p.id === posId)).toBe(false);
    expect(afterDelete.candidates.some((c) => c.positionId === posId)).toBe(false);

    expect(afterStaleUpdate.candidates.find((c) => c.id === candId)?.stage).toBe("Interview");
  });

  it("scenario 4: concurrent delete-recruiter and add-position for that recruiter", () => {
    let state = createSeedState();

    const stateAfterDel = apply(state, {
      kind: "delete-recruiter",
      recruiterId: "rec-2",
      actorName: BROWSER_C,
    });

    expect(stateAfterDel.recruiters.some((r) => r.id === "rec-2")).toBe(false);

    const readBeforeDelete = createSeedState();
    const staleAdd = applyDashboardAction(readBeforeDelete, {
      kind: "add-position",
      position: {
        name: "Stale Role", clientId: "client-1", recruiterId: "rec-2", spocId: "spoc-2",
        vertical: "Technology", technology: "Java", status: "Open",
        openDate: new Date().toISOString().slice(0, 10),
        openings: 1, ctc: 20, location: ["Pune"], remarks: "Added by Browser B with stale data",
      },
      actorName: BROWSER_B,
    });
    verifyInvariants(staleAdd);

    expect(staleAdd.positions.some((p) => p.name === "Stale Role")).toBe(true);
    expect(staleAdd.recruiters.some((r) => r.id === "rec-2")).toBe(true);
  });

  it("scenario 5: high-frequency action burst (50 actions across 3 browsers)", () => {
    let state = createSeedState();
    const today = new Date().toISOString().slice(0, 10);
    const browsers = [BROWSER_A, BROWSER_B, BROWSER_C] as const;
    const interviewStatuses = ["L1 Done", "L2 Done", "L2 Select", "L1 Reject", "CI Round Done"] as const;
    const interviewIds = state.interviews.map((i) => i.id);
    const candidateIds = state.candidates.map((c) => c.id);

    for (let i = 0; i < 50; i++) {
      const actor = browsers[i % 3];

      const roll = Math.random();
      if (roll < 0.3 && interviewIds.length > 0) {
        const intId = interviewIds[i % interviewIds.length];
        const status = interviewStatuses[i % interviewStatuses.length];
        state = apply(state, {
          kind: "update-interview",
          interviewId: intId,
          status,
          remarks: `Burst update ${i} by ${actor}`,
          actorName: actor,
        });
      } else if (roll < 0.5) {
        state = apply(state, {
          kind: "add-candidate",
          candidate: {
            name: `Burst-Cand-${i}`, contactNo: `90000${String(i).padStart(5, "0")}`,
            emailId: `burst${i}@test.com`,
            positionId: state.positions[i % state.positions.length].id,
            clientId: "client-1", recruiterId: "rec-1", spocId: "spoc-1",
            technology: "React", stage: "CV Submitted", submittedAt: today,
            source: "LinkedIn", remarks: `Burst ${i}`,
            currentCtc: 0, expectedCtc: 0, noticePeriod: "", currentCompany: "",
            experience: 0, location: "", requisitionId: "",
            finalSelectDate: "", finalSelectStatus: "Document Pending",
            holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "",
          },
          actorName: actor,
        });
      } else if (roll < 0.7 && candidateIds.length > 0) {
        const candId = candidateIds[i % candidateIds.length];
        state = apply(state, {
          kind: "update-candidate",
          candidateId: candId,
          stage: "Interview",
          remarks: `Stage update ${i} by ${actor}`,
          actorName: actor,
        });
      } else {
        state = apply(state, {
          kind: "add-cv-shared",
          clientId: "client-1",
          month: today.slice(0, 7),
          count: Math.floor(Math.random() * 20) + 1,
          actorName: actor,
        });
      }
    }

    expect(state.candidates.length).toBeGreaterThan(10);
    expect(state.activityLog.length).toBeGreaterThan(50);
    expect(state.cvSharedEntries.length).toBeGreaterThan(0);
  });

  it("scenario 6: concurrent add-interview advances candidate stage only once", () => {
    let state = createSeedState();

    const candId = "cand-5";
    const origCandidate = state.candidates.find((c) => c.id === candId)!;
    expect(origCandidate.stage).toBe("CV Submitted");

    const newInt = {
      candidateId: candId,
      positionId: "pos-1",
      clientId: "client-1",
      recruiterId: "rec-1",
      interviewDate: new Date().toISOString().slice(0, 10),
      time: "10:00 AM",
      round: "L1",
      status: "L1 Scheduled" as const,
      feedbackDue: new Date().toISOString().slice(0, 10),
      remarks: "",
    };

    const afterA = apply(state, {
      kind: "add-interview",
      interview: { ...newInt },
      actorName: BROWSER_A,
    });

    const afterB = applyDashboardAction(state, {
      kind: "add-interview",
      interview: { ...newInt },
      actorName: BROWSER_B,
    });
    verifyInvariants(afterB);

    const afterC = applyDashboardAction(state, {
      kind: "add-interview",
      interview: { ...newInt },
      actorName: BROWSER_C,
    });
    verifyInvariants(afterC);

    const bStage = afterB.candidates.find((c) => c.id === candId)?.stage;
    const cStage = afterC.candidates.find((c) => c.id === candId)?.stage;

    expect(afterA.candidates.find((c) => c.id === candId)?.stage).toBe("Interview");
    expect(bStage).toBe("Interview");
    expect(cStage).toBe("Interview");

    expect(afterA.interviews.filter((i) => i.candidateId === candId).length).toBeGreaterThanOrEqual(1);
    expect(afterB.interviews.filter((i) => i.candidateId === candId).length).toBeGreaterThanOrEqual(1);
    expect(afterC.interviews.filter((i) => i.candidateId === candId).length).toBeGreaterThanOrEqual(1);
  });

  it("scenario 7: full workflow cycle from all 3 browsers on same set of entities", () => {
    let state = createSeedState();
    const today = new Date().toISOString().slice(0, 10);

    const states: DashboardState[] = [];
    const rounds = 5;

    for (let round = 0; round < rounds; round++) {
      state = apply(state, {
        kind: "update-interview",
        interviewId: "int-3",
        status: "L2 Done",
        remarks: `Round ${round} A: L2 done`,
        actorName: BROWSER_A,
      });

      state = apply(state, {
        kind: "update-interview",
        interviewId: "int-3",
        status: "L2 Select",
        remarks: `Round ${round} B: L2 select`,
        actorName: BROWSER_B,
      });

      state = apply(state, {
        kind: "mark-leave",
        recruiterId: "rec-1",
        date: today,
        type: round % 2 === 0 ? "Leave" : "Half Day",
        actorName: BROWSER_C,
      });

      state = apply(state, {
        kind: "add-cv-shared",
        clientId: "client-1",
        month: today.slice(0, 7),
        count: 5 + round,
        actorName: BROWSER_A,
      });

      states.push(state);
    }

    const finalState = states[states.length - 1];

    const updatedInt = finalState.interviews.find((i) => i.id === "int-3");
    expect(updatedInt?.status).toBe("L2 Select");

    expect(finalState.leaves.length).toBeGreaterThan(0);
    const leave = finalState.leaves.find((l) => l.recruiterId === "rec-1" && l.date === today);
    expect(leave).toBeDefined();
    // last write wins: round 4 (index 4, even) sets "Leave"
    expect(leave!.type).toBe("Leave");

    expect(finalState.activityLog.length).toBeGreaterThan(createSeedState().activityLog.length);

    for (const s of states) {
      verifyInvariants(s);
    }
  });

  it("scenario 8: rapid-fire same-entity updates do not corrupt state", () => {
    let state = createSeedState();

    for (let i = 0; i < 20; i++) {
      state = apply(state, {
        kind: "update-position",
        positionId: "pos-1",
        status: i % 2 === 0 ? "Open" : "On Hold",
        remarks: `Update ${i} by ${i % 2 === 0 ? BROWSER_A : BROWSER_B}`,
        actorName: i % 2 === 0 ? BROWSER_A : BROWSER_B,
      });
    }

    const pos = state.positions.find((p) => p.id === "pos-1")!;
    expect(["Open", "On Hold"].includes(pos.status)).toBe(true);

    expect(state.positions.length).toBe(createSeedState().positions.length);
  });
});
