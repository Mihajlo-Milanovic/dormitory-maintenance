export type ReportCategory = 'plumbing' | 'electrical' | 'furniture' | 'heating' | 'other';

export type ReportSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ReportStatus =
  | 'Waiting'
  | 'Accepted'
  | 'Repair in progress'
  | 'Waiting for supplies'
  | 'Finished'
  | 'Cancelled';

export interface ReportEvent {
  id: string;
  status: ReportStatus;
  comment?: string;
  createdAt: string;
  authorName: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  location: string;
  severity: ReportSeverity;
  status: ReportStatus;
  studentId: string;
  studentName: string;
  janitorId?: string;
  janitorName?: string;
  timeEstimateMinutes?: number;
  photoUrl?: string;
  events: ReportEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  location: string;
  severity: ReportSeverity;
  photoUrl?: string;
}
