import { Badge } from "@/components/ui/badge";
import type { CandidateStage, FinalSelectStatus, InterviewStatus, JoiningStatus, OfferStatus, PositionStatus, SelectionOfferStatus } from "@/lib/data/types";

const interviewTone: Record<string, "warning" | "teal" | "success" | "danger" | "purple"> = {
  "L1 Scheduled": "warning",
  "L2 Scheduled": "warning",
  "CI Round Scheduled": "warning",
  "L1 Done": "teal",
  "L2 Done": "teal",
  "CI Round Done": "teal",
  "L1 Select": "success",
  "L2 Select": "success",
  "L1 Reject": "danger",
  "L2 Reject": "danger",
  "CI Reject": "danger",
  "Final Select": "success",
  "No Show": "danger",
  "Panel No Show": "danger",
  "Cancelled": "purple",
};

function statusTone(status: string): "default" | "success" | "warning" | "danger" | "info" | "slate" | "teal" | "purple" {
  const s = status.toLowerCase();

  if (s in interviewTone) {
    return interviewTone[status] ?? interviewTone[s] ?? "default";
  }

  if (s === "open") return "success";
  if (s === "on hold") return "warning";
  if (s === "closed") return "slate";
  if (s === "filled") return "info";

  if (s.includes("document pending")) return "warning";
  if (s.includes("document shared")) return "info";
  if (s.includes("ctc discussion") || s.includes("client round pending")) return "warning";
  if (s.includes("pre offer lose") || s.includes("client reject") || s.includes("bgv reject")) return "danger";
  if (s.includes("offer released") || s === "joined") return "success";
  if (s === "screen reject") return "danger";
  if (s === "drop") return "slate";
  if (s === "duplicate") return "warning";

  if (s.includes("joining pending")) return "warning";
  if (s === "offer declined") return "danger";

  return "default";
}

export function StatusPill({
  status,
}: {
  status: PositionStatus | InterviewStatus | OfferStatus | JoiningStatus | CandidateStage | FinalSelectStatus | SelectionOfferStatus | string;
}) {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}
