import { Report } from '../../../shared/models/report.model';
import { SupplyRequest } from '../../../shared/models/supply.model';

export interface JanitorState {
  openReports: Report[];
  myJobs: Report[];
  selectedReport: Report | null;
  supplyRequests: SupplyRequest[];
  loading: boolean;
  error: string | null;
}

export const initialJanitorState: JanitorState = {
  openReports: [],
  myJobs: [],
  selectedReport: null,
  supplyRequests: [],
  loading: false,
  error: null,
};
