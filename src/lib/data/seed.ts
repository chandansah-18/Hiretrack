import {
  type ActivityLog,
  type Candidate,
  type Client,
  type ClientSpoc,
  type CvSharedEntry,
  type DashboardState,
  type Interview,
  type Joining,
  type LeaveRecord,
  type Offer,
  type Position,
  type Recruiter,
} from "./types";

function isoDateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildActivityLog(): ActivityLog[] {
  return [
    {
      id: "log-1",
      timestamp: new Date().toISOString(),
      actorRole: "admin",
      actorName: "Operations Admin",
      action: "Updated interview status",
      entityType: "interview",
      entityId: "int-2",
      entityName: "Nadia Khan",
      description: "Moved Nadia Khan to CI Round Done and added manager feedback.",
    },
    {
      id: "log-2",
      timestamp: isoDateOffset(-1),
      actorRole: "recruiter",
      actorName: "Riya Kapoor",
      action: "Advanced candidate stage",
      entityType: "candidate",
      entityId: "cand-4",
      entityName: "Karan Mehta",
      description: "Promoted Karan Mehta to Final Selection after second round.",
    },
    {
      id: "log-3",
      timestamp: isoDateOffset(-2),
      actorRole: "admin",
      actorName: "Operations Admin",
      action: "Updated offer status",
      entityType: "offer",
      entityId: "offer-1",
      entityName: "Aditi Rao",
      description: "Offer accepted and moved toward joining confirmation.",
    },
  ];
}

export function createSeedState(): DashboardState {
  const clients: Client[] = [
    { id: "client-1", name: "Nova Health", industry: "Healthcare", ownerRecruiterId: "rec-1" },
    { id: "client-2", name: "Orion Retail", industry: "Retail", ownerRecruiterId: "rec-3" },
    { id: "client-3", name: "Apex Logistics", industry: "Logistics", ownerRecruiterId: "rec-2" },
    { id: "client-4", name: "BluePeak Fintech", industry: "Financial Services", ownerRecruiterId: "rec-4" },
  ];

const recruiters: Recruiter[] = [
  { id: "rec-admin", name: "Chandan Sah", email: "chandan.sah@huntsmenbarons.com", contactNo: "+91-9999000100", designation: "AVP", vertical: "General", target: 0, active: true, canEdit: true, birthday: "1990-03-15" },
  { id: "rec-1", name: "Aman Singh", email: "aman.singh@huntsmenbarons.com", contactNo: "+91-9999000101", designation: "Senior Recruiter", vertical: "Technology", target: 28, active: true, canEdit: true, birthday: "1992-07-22" },
  { id: "rec-2", name: "Riya Kapoor", email: "riya.kapoor@huntsmenbarons.com", contactNo: "+91-9999000102", designation: "Recruiter", vertical: "Technology", target: 24, active: true, canEdit: true, birthday: "1994-11-08" },
  { id: "rec-3", name: "Arjun Patel", email: "arjun.patel@huntsmenbarons.com", contactNo: "+91-9999000103", designation: "Asst. Manager", vertical: "Operations", target: 20, active: true, canEdit: true, birthday: "1991-05-19" },
  { id: "rec-4", name: "Neha Rao", email: "neha.rao@huntsmenbarons.com", contactNo: "+91-9999000104", designation: "Jr. Recruiter", vertical: "Finance", target: 18, active: true, canEdit: true, birthday: "1993-09-30" },
];

  const spocs: ClientSpoc[] = [
    { id: "spoc-1", clientId: "client-1", name: "Alice Mehta", email: "alice@nova.test", recruiterId: "rec-1" },
    { id: "spoc-2", clientId: "client-1", name: "Rahul Sharma", email: "rahul@nova.test", recruiterId: "rec-2" },
    { id: "spoc-3", clientId: "client-2", name: "Priya Nair", email: "priya@orion.test", recruiterId: "rec-3" },
    { id: "spoc-4", clientId: "client-3", name: "Kunal Verma", email: "kunal@apex.test", recruiterId: "rec-1" },
    { id: "spoc-5", clientId: "client-4", name: "Seema Iyer", email: "seema@bluepeak.test", recruiterId: "rec-4" },
  ];

  const positions: Position[] = [
    { id: "pos-1", name: "Senior React Engineer", clientId: "client-1", recruiterId: "rec-1", spocId: "spoc-1", vertical: "Technology", technology: "React", status: "Open", openDate: isoDateOffset(-18), openings: 2, ctc: 24, location: ["Bangalore"], remarks: "Priority role for digital platform." },
    { id: "pos-2", name: "Java Backend Lead", clientId: "client-1", recruiterId: "rec-2", spocId: "spoc-2", vertical: "Technology", technology: "Java", status: "On Hold", openDate: isoDateOffset(-22), openings: 1, ctc: 28, location: ["Pune"], remarks: "Paused pending budget approval." },
    { id: "pos-3", name: "Regional Sales Manager", clientId: "client-2", recruiterId: "rec-3", spocId: "spoc-3", vertical: "Operations", technology: "Sales", status: "Open", openDate: isoDateOffset(-14), openings: 3, ctc: 18, location: ["Mumbai", "Pune"], remarks: "North zone hiring drive." },
    { id: "pos-4", name: "Data Analyst", clientId: "client-4", recruiterId: "rec-4", spocId: "spoc-5", vertical: "Finance", technology: "SQL", status: "Open", openDate: isoDateOffset(-11), openings: 2, ctc: 12, location: ["Hyderabad"], remarks: "Reporting and forecasting support." },
    { id: "pos-5", name: "DevOps Engineer", clientId: "client-3", recruiterId: "rec-1", spocId: "spoc-4", vertical: "Technology", technology: "AWS", status: "Open", openDate: isoDateOffset(-9), openings: 1, ctc: 22, location: ["Bangalore", "Chennai"], remarks: "Pipeline automation focus." },
    { id: "pos-6", name: "Product Owner", clientId: "client-4", recruiterId: "rec-2", spocId: "spoc-5", vertical: "Finance", technology: "Agile", status: "Closed", openDate: isoDateOffset(-31), openings: 1, ctc: 30, location: ["Mumbai"], remarks: "Closed after two hires." },
  ];

  const candidates: Candidate[] = [
    { id: "cand-1", name: "Aditi Rao", contactNo: "9876500011", emailId: "aditi.r@email.com", positionId: "pos-1", clientId: "client-1", recruiterId: "rec-1", spocId: "spoc-1", technology: "React", stage: "Offer", submittedAt: isoDateOffset(-2), source: "LinkedIn", remarks: "Strong system design skills.", currentCtc: 18, expectedCtc: 24, noticePeriod: "30 days", currentCompany: "TechStart Inc", experience: 5, location: "Bangalore", requisitionId: "REQ-001", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
    { id: "cand-2", name: "Nadia Khan", contactNo: "9876500012", emailId: "nadia.k@email.com", positionId: "pos-2", clientId: "client-1", recruiterId: "rec-2", spocId: "spoc-2", technology: "Java", stage: "Interview", submittedAt: isoDateOffset(-1), source: "Referral", remarks: "Second round scheduled.", currentCtc: 14, expectedCtc: 20, noticePeriod: "45 days", currentCompany: "DataFlow Systems", experience: 4, location: "Pune", requisitionId: "REQ-002", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
    { id: "cand-3", name: "Karan Mehta", contactNo: "9876500013", emailId: "karan.m@email.com", positionId: "pos-3", clientId: "client-2", recruiterId: "rec-3", spocId: "spoc-3", technology: "Sales", stage: "Final Selection", submittedAt: isoDateOffset(-4), source: "Naukri", remarks: "Awaiting offer approval.", currentCtc: 12, expectedCtc: 18, noticePeriod: "30 days", currentCompany: "Global Sales Corp", experience: 6, location: "Mumbai", requisitionId: "REQ-003", finalSelectDate: isoDateOffset(-3), finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
    { id: "cand-4", name: "Priyanka Bose", contactNo: "9876500014", emailId: "priyanka.b@email.com", positionId: "pos-4", clientId: "client-4", recruiterId: "rec-4", spocId: "spoc-5", technology: "SQL", stage: "Joined", submittedAt: isoDateOffset(-7), source: "Referral", remarks: "Joined this month.", currentCtc: 9, expectedCtc: 12, noticePeriod: "15 days", currentCompany: "Analytics Pro", experience: 3, location: "Hyderabad", requisitionId: "REQ-004", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
    { id: "cand-5", name: "Vivek Sharma", contactNo: "9876500015", emailId: "vivek.s@email.com", positionId: "pos-1", clientId: "client-1", recruiterId: "rec-1", spocId: "spoc-1", technology: "React", stage: "CV Submitted", submittedAt: isoDateOffset(0), source: "Career Page", remarks: "Fresh application.", currentCtc: 0, expectedCtc: 0, noticePeriod: "", currentCompany: "", experience: 0, location: "Bangalore", requisitionId: "", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
    { id: "cand-6", name: "Meera Joshi", contactNo: "9876500016", emailId: "meera.j@email.com", positionId: "pos-5", clientId: "client-3", recruiterId: "rec-1", spocId: "spoc-4", technology: "AWS", stage: "Interview", submittedAt: isoDateOffset(-3), source: "Reference", remarks: "Interview feedback pending.", currentCtc: 16, expectedCtc: 22, noticePeriod: "60 days", currentCompany: "CloudBase Inc", experience: 5, location: "Chennai", requisitionId: "REQ-005", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
    { id: "cand-7", name: "Arjun Kulkarni", contactNo: "9876500017", emailId: "arjun.k@email.com", positionId: "pos-3", clientId: "client-2", recruiterId: "rec-3", spocId: "spoc-3", technology: "Sales", stage: "Rejected", submittedAt: isoDateOffset(-8), source: "LinkedIn", remarks: "Not aligned to travel requirement.", currentCtc: 0, expectedCtc: 0, noticePeriod: "", currentCompany: "SalesTech Ltd", experience: 2, location: "Pune", requisitionId: "REQ-003", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
    { id: "cand-8", name: "Sana Sheikh", contactNo: "9876500018", emailId: "sana.s@email.com", positionId: "pos-4", clientId: "client-4", recruiterId: "rec-4", spocId: "spoc-5", technology: "Excel", stage: "Final Selection", submittedAt: isoDateOffset(-5), source: "Referral", remarks: "Waiting for offer sign-off.", currentCtc: 8, expectedCtc: 12, noticePeriod: "15 days", currentCompany: "DataWorks", experience: 3, location: "Hyderabad", requisitionId: "REQ-004", finalSelectDate: isoDateOffset(-2), finalSelectStatus: "CTC Discussion", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
    { id: "cand-9", name: "Rohit Deshmukh", contactNo: "9876500019", emailId: "rohit.d@email.com", positionId: "pos-5", clientId: "client-3", recruiterId: "rec-1", spocId: "spoc-4", technology: "Kubernetes", stage: "CV Submitted", submittedAt: isoDateOffset(-2), source: "Agency", remarks: "Potential for backend role too.", currentCtc: 0, expectedCtc: 0, noticePeriod: "", currentCompany: "", experience: 0, location: "Bangalore", requisitionId: "", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
    { id: "cand-10", name: "Maya Fernandes", contactNo: "9876500020", emailId: "maya.f@email.com", positionId: "pos-2", clientId: "client-1", recruiterId: "rec-2", spocId: "spoc-2", technology: "Spring", stage: "Interview", submittedAt: isoDateOffset(0), source: "LinkedIn", remarks: "Strong leadership profile.", currentCtc: 20, expectedCtc: 28, noticePeriod: "30 days", currentCompany: "Enterprise Solutions", experience: 7, location: "Mumbai", requisitionId: "REQ-002", finalSelectDate: "", finalSelectStatus: "Document Pending", holdingOfferCtc: 0, holdingOfferCompany: "", holdingOfferDoj: "" },
  ];

  const interviews: Interview[] = [
    // Aditi Rao — L1 → L2 → CI complete
    { id: "int-1", candidateId: "cand-1", positionId: "pos-1", clientId: "client-1", recruiterId: "rec-1", interviewDate: isoDateOffset(-14), time: "10:00 AM", round: "L1", status: "L1 Done", feedbackDue: isoDateOffset(-12), remarks: "Strong technical skills." },
    { id: "int-1b", candidateId: "cand-1", positionId: "pos-1", clientId: "client-1", recruiterId: "rec-1", interviewDate: isoDateOffset(-7), time: "11:00 AM", round: "L2", status: "L2 Select", feedbackDue: isoDateOffset(-5), remarks: "Approved by client." },
    { id: "int-1c", candidateId: "cand-1", positionId: "pos-1", clientId: "client-1", recruiterId: "rec-1", interviewDate: isoDateOffset(-3), time: "3:00 PM", round: "CI", status: "CI Round Done", feedbackDue: isoDateOffset(-1), remarks: "Panel interview passed." },
    // Karan Mehta — L1 Select but waiting for L2
    { id: "int-2", candidateId: "cand-3", positionId: "pos-3", clientId: "client-2", recruiterId: "rec-3", interviewDate: isoDateOffset(-7), time: "9:30 AM", round: "L1", status: "L1 Select", feedbackDue: isoDateOffset(-5), remarks: "Feedback received from business head." },
    // Meera Joshi — L1 Done awaiting update
    { id: "int-3", candidateId: "cand-6", positionId: "pos-5", clientId: "client-3", recruiterId: "rec-1", interviewDate: isoDateOffset(-2), time: "3:30 PM", round: "L1", status: "L1 Done", feedbackDue: isoDateOffset(1), remarks: "Tech interview completed." },
    // Sana Sheikh — L2 Scheduled
    { id: "int-4", candidateId: "cand-8", positionId: "pos-4", clientId: "client-4", recruiterId: "rec-4", interviewDate: isoDateOffset(-5), time: "4:00 PM", round: "L1", status: "L1 Done", feedbackDue: isoDateOffset(-3), remarks: "Good communication skills." },
    { id: "int-4b", candidateId: "cand-8", positionId: "pos-4", clientId: "client-4", recruiterId: "rec-4", interviewDate: isoDateOffset(2), time: "11:00 AM", round: "L2", status: "L2 Scheduled", feedbackDue: isoDateOffset(4), remarks: "Client feedback awaited." },
    // Rohit Deshmukh — L1 Scheduled
    { id: "int-5", candidateId: "cand-9", positionId: "pos-5", clientId: "client-3", recruiterId: "rec-1", interviewDate: isoDateOffset(1), time: "5:00 PM", round: "L1", status: "L1 Scheduled", feedbackDue: isoDateOffset(2), remarks: "Schedule confirmed." },
    // Maya Fernandes — L1 Reject
    { id: "int-6", candidateId: "cand-10", positionId: "pos-2", clientId: "client-1", recruiterId: "rec-2", interviewDate: isoDateOffset(-3), time: "6:00 PM", round: "L1", status: "L1 Reject", feedbackDue: isoDateOffset(-1), remarks: "Not enough experience." },
    // Vivek Sharma — L1 Scheduled today
    { id: "int-7", candidateId: "cand-5", positionId: "pos-1", clientId: "client-1", recruiterId: "rec-1", interviewDate: isoDateOffset(0), time: "6:30 PM", round: "L1", status: "L1 Scheduled", feedbackDue: isoDateOffset(1), remarks: "Screening interview today." },
    // Arjun Kulkarni cancelled
    { id: "int-8", candidateId: "cand-7", positionId: "pos-3", clientId: "client-2", recruiterId: "rec-3", interviewDate: isoDateOffset(-6), time: "3:30 PM", round: "L1", status: "Cancelled", feedbackDue: isoDateOffset(-4), remarks: "Candidate withdrew." },
    // Nadia Khan — No Show
    { id: "int-9", candidateId: "cand-2", positionId: "pos-2", clientId: "client-1", recruiterId: "rec-2", interviewDate: isoDateOffset(-1), time: "8:00 PM", round: "L1", status: "No Show", feedbackDue: isoDateOffset(0), remarks: "Candidate did not join." },
  ];

  const offers: Offer[] = [
    { id: "offer-1", candidateId: "cand-1", positionId: "pos-1", clientId: "client-1", recruiterId: "rec-1", status: "Accepted", offerDate: isoDateOffset(-1), ctc: 2400000, remarks: "Offer accepted in principle.", billValue: 200000, selectionStatus: "Joining Pending" },
    { id: "offer-2", candidateId: "cand-3", positionId: "pos-3", clientId: "client-2", recruiterId: "rec-3", status: "Sent", offerDate: isoDateOffset(0), ctc: 1800000, remarks: "Awaiting candidate confirmation.", billValue: 0, selectionStatus: "Joining Pending" },
    { id: "offer-3", candidateId: "cand-4", positionId: "pos-4", clientId: "client-4", recruiterId: "rec-4", status: "Accepted", offerDate: isoDateOffset(-5), ctc: 1500000, remarks: "Joined after acceptance.", billValue: 125000, selectionStatus: "Joined" },
    { id: "offer-4", candidateId: "cand-8", positionId: "pos-4", clientId: "client-4", recruiterId: "rec-4", status: "Pending", offerDate: isoDateOffset(1), ctc: 1450000, remarks: "Offer draft ready.", billValue: 0, selectionStatus: "Joining Pending" },
  ];

  const joinings: Joining[] = [
    { id: "join-1", candidateId: "cand-1", positionId: "pos-1", clientId: "client-1", recruiterId: "rec-1", status: "Joining Delayed", joiningDate: isoDateOffset(7), remarks: "Notice period extension requested." },
    { id: "join-2", candidateId: "cand-4", positionId: "pos-4", clientId: "client-4", recruiterId: "rec-4", status: "Joined", joiningDate: isoDateOffset(-1), remarks: "Joined successfully." },
  ];

  function isoMonthOffset(offset: number) {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
  }

  const cvSharedEntries: CvSharedEntry[] = [
    { id: "cv-1", clientId: "client-1", month: isoMonthOffset(0), count: 15 },
    { id: "cv-2", clientId: "client-2", month: isoMonthOffset(0), count: 10 },
    { id: "cv-3", clientId: "client-3", month: isoMonthOffset(0), count: 8 },
    { id: "cv-4", clientId: "client-4", month: isoMonthOffset(0), count: 12 },
    { id: "cv-5", clientId: "client-1", month: isoMonthOffset(-1), count: 20 },
    { id: "cv-6", clientId: "client-2", month: isoMonthOffset(-1), count: 14 },
    { id: "cv-7", clientId: "client-3", month: isoMonthOffset(-1), count: 6 },
    { id: "cv-8", clientId: "client-4", month: isoMonthOffset(-1), count: 18 },
    { id: "cv-9", clientId: "client-1", month: isoMonthOffset(-2), count: 22 },
    { id: "cv-10", clientId: "client-2", month: isoMonthOffset(-2), count: 12 },
    { id: "cv-11", clientId: "client-3", month: isoMonthOffset(-2), count: 9 },
    { id: "cv-12", clientId: "client-4", month: isoMonthOffset(-2), count: 15 },
  ];

  return {
    currentUserRole: "admin",
    currentUserName: "Operations Admin",
    clients,
    spocs,
    recruiters,
    positions,
    candidates,
    interviews,
    offers,
    joinings,
    cvSharedEntries,
    leaves: [] as LeaveRecord[],
    activityLog: buildActivityLog(),
  };
}
