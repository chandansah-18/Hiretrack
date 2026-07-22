export type Role = "admin" | "manager" | "recruiter";

export type PositionStatus = "Open" | "On Hold" | "Closed" | "Filled";
export type InterviewStatus = "L1 Scheduled" | "L1 Done" | "L1 Select" | "L1 Reject" | "L2 Scheduled" | "L2 Done" | "L2 Select" | "L2 Reject" | "CI Round Scheduled" | "CI Round Done" | "CI Reject" | "Final Select" | "No Show" | "Panel No Show" | "Cancelled";
export type CandidateStage = "CV Submitted" | "Interview" | "Final Selection" | "Offer" | "Joined" | "Rejected" | "Screen Reject" | "Drop" | "Duplicate";
export type FinalSelectStatus = "Document Pending" | "Document Shared" | "CTC Discussion" | "Pre Offer Lose" | "Offer Released" | "Client Round Pending" | "Client Reject" | "Drop" | "BGV Reject";
export type OfferStatus = "Pending" | "Sent" | "Accepted" | "Declined";
export type SelectionOfferStatus = "Offer Declined" | "Joined" | "Joining Pending";
export type JoiningStatus = "Not Joined" | "Joining Delayed" | "Joined";

export interface CvSharedEntry {
  id: string;
  clientId: string;
  month: string;
  count: number;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  ownerRecruiterId: string;
}

export interface ClientSpoc {
  id: string;
  clientId: string;
  name: string;
  email: string;
  recruiterId: string;
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  contactNo?: string;
  designation?: string;
  vertical: string;
  target: number;
  active: boolean;
  canEdit: boolean;
  birthday?: string;
}

export interface Position {
  id: string;
  name: string;
  clientId: string;
  recruiterId: string;
  spocId: string;
  vertical: string;
  technology: string;
  status: PositionStatus;
  openDate: string;
  openings: number;
  ctc: number;
  location: string[];
  remarks: string;
}

export interface Candidate {
  id: string;
  name: string;
  contactNo: string;
  emailId: string;
  positionId: string;
  clientId: string;
  recruiterId: string;
  spocId: string;
  technology: string;
  stage: CandidateStage;
  submittedAt: string;
  source: string;
  remarks: string;
  currentCtc: number;
  expectedCtc: number;
  noticePeriod: string;
  currentCompany: string;
  experience: number;
  location: string;
  requisitionId: string;
  finalSelectDate: string;
  finalSelectStatus: FinalSelectStatus;
  holdingOfferCtc: number;
  holdingOfferCompany: string;
  holdingOfferDoj: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  positionId: string;
  clientId: string;
  recruiterId: string;
  interviewDate: string;
  time: string;
  round: string;
  status: InterviewStatus;
  feedbackDue: string;
  remarks: string;
}

export interface Offer {
  id: string;
  candidateId: string;
  positionId: string;
  recruiterId: string;
  clientId: string;
  status: OfferStatus;
  offerDate: string;
  ctc: number;
  remarks: string;
  billValue: number;
  selectionStatus: SelectionOfferStatus;
}

export interface Joining {
  id: string;
  candidateId: string;
  positionId: string;
  recruiterId: string;
  clientId: string;
  status: JoiningStatus;
  joiningDate: string;
  remarks: string;
}

export type LeaveType = "Leave" | "Half Day" | "Absent";

export interface LeaveRecord {
  id: string;
  recruiterId: string;
  date: string;
  type: LeaveType;
  markedBy: string;
  remarks?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorRole: Role;
  actorName: string;
  action: string;
  entityType: "position" | "candidate" | "interview" | "offer" | "joining" | "role" | "client" | "spoc" | "recruiter";
  entityId: string;
  entityName: string;
  description: string;
}

export interface DashboardFilters {
  search: string;
  clientId: string;
  recruiterId: string;
  spocId: string;
  vertical: string;
  positionId: string;
  status: string;
  fromDate: string;
  toDate: string;
}

export interface DashboardState {
  currentUserRole: Role;
  currentUserName: string;
  clients: Client[];
  spocs: ClientSpoc[];
  recruiters: Recruiter[];
  positions: Position[];
  candidates: Candidate[];
  interviews: Interview[];
  offers: Offer[];
  joinings: Joining[];
  cvSharedEntries: CvSharedEntry[];
  leaves: LeaveRecord[];
  activityLog: ActivityLog[];
}

export interface LookupTables {
  clients: Map<string, Client>;
  spocs: Map<string, ClientSpoc>;
  recruiters: Map<string, Recruiter>;
  positions: Map<string, Position>;
  candidates: Map<string, Candidate>;
  interviews: Map<string, Interview>;
  offers: Map<string, Offer>;
  joinings: Map<string, Joining>;
}

export const defaultFilters: DashboardFilters = {
  search: "",
  clientId: "",
  recruiterId: "",
  spocId: "",
  vertical: "",
  positionId: "",
  status: "",
  fromDate: "",
  toDate: "",
};
