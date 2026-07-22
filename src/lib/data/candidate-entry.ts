import type { Candidate, CandidateStage, FinalSelectStatus, Position } from "./types";
import { createPrefixedId } from "./id";

export const CANDIDATE_SOURCES = [
  "LinkedIn",
  "Referral",
  "Naukri",
  "Career Page",
  "Agency",
  "Reference",
  "Other",
] as const;

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function generateCandidateId() {
  return createPrefixedId("cand");
}

export interface CandidateEntryFields {
  name: string;
  contactNo?: string;
  emailId?: string;
  source?: string;
  remarks?: string;
  technology?: string;
  currentCtc?: number;
  expectedCtc?: number;
  noticePeriod?: string;
  currentCompany?: string;
  experience?: number;
  location?: string;
  requisitionId?: string;
  stage?: CandidateStage;
  submittedAt?: string;
  finalSelectDate?: string;
  finalSelectStatus?: FinalSelectStatus;
  holdingOfferCtc?: number;
  holdingOfferCompany?: string;
  holdingOfferDoj?: string;
}

export function buildCandidatePayload(
  fields: CandidateEntryFields,
  position: Position,
  recruiterId: string
): Omit<Candidate, "id"> {
  return {
    name: fields.name.trim(),
    contactNo: fields.contactNo ?? "",
    emailId: fields.emailId ?? "",
    positionId: position.id,
    clientId: position.clientId,
    recruiterId,
    spocId: position.spocId,
    technology: fields.technology?.trim() || position.technology,
    stage: fields.stage ?? "CV Submitted",
    submittedAt: fields.submittedAt ?? todayDateString(),
    source: fields.source ?? "Other",
    remarks: fields.remarks ?? "",
    currentCtc: fields.currentCtc ?? 0,
    expectedCtc: fields.expectedCtc ?? 0,
    noticePeriod: fields.noticePeriod ?? "",
    currentCompany: fields.currentCompany ?? "",
    experience: fields.experience ?? 0,
    location: fields.location ?? "",
    requisitionId: fields.requisitionId ?? "",
    finalSelectDate: fields.finalSelectDate ?? "",
    finalSelectStatus: fields.finalSelectStatus ?? "Document Pending",
    holdingOfferCtc: fields.holdingOfferCtc ?? 0,
    holdingOfferCompany: fields.holdingOfferCompany ?? "",
    holdingOfferDoj: fields.holdingOfferDoj ?? "",
  };
}

export function validateCandidatePayload(payload: Omit<Candidate, "id">): string | null {
  if (!payload.name.trim()) return "Candidate name is required.";
  if (!payload.positionId) return "Position is required.";
  if (!payload.recruiterId) return "Could not identify your recruiter profile. Please contact admin.";
  if (!payload.clientId) return "Client is missing for the selected position.";
  if (!payload.spocId) return "POC is not configured for this position. Update the position first.";
  return null;
}
