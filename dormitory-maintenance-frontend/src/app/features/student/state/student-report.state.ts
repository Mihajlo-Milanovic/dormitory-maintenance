import { Report } from '../../../shared/models/report.model';

export interface StudentReportState {
  reports: Report[];
  selectedReport: Report | null;
  loading: boolean;
  error: string | null;
}

export const initialStudentReportState: StudentReportState = {
  reports: [],
  selectedReport: null,
  loading: false,
  error: null,
};
