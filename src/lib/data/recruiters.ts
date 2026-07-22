import type { Recruiter } from "./types";

export function resolveRecruiterId(
  recruiters: Recruiter[],
  email?: string,
  name?: string
): string {
  if (email) {
    const normalized = email.trim().toLowerCase();
    const byEmail = recruiters.find((r) => r.email.trim().toLowerCase() === normalized);
    if (byEmail) return byEmail.id;
  }

  if (name) {
    const normalized = name.trim().toLowerCase();
    const byName = recruiters.find((r) => r.name.trim().toLowerCase() === normalized);
    if (byName) return byName.id;
  }

  return "";
}

export function buildRecruiterIdForUser(userId: string) {
  return `rec-${userId.replace(/-/g, "").slice(0, 12)}`;
}
