import { createReducer, on } from '@ngrx/store';
import { initialJanitorState } from './janitor.state';
import { JanitorActions } from './janitor.actions';

export const janitorReducer = createReducer(
  initialJanitorState,
  on(
    JanitorActions.loadOpenReports,
    JanitorActions.loadMyJobs,
    JanitorActions.loadJobDetail,
    JanitorActions.acceptReport,
    JanitorActions.setTimeEstimate,
    JanitorActions.updateStatus,
    JanitorActions.requestSupplies,
    JanitorActions.resumeJob,
    (state) => ({
      ...state,
      loading: true,
      error: null,
    })
  ),
  on(JanitorActions.loadOpenReportsSuccess, (state, { reports }) => ({
    ...state,
    openReports: reports,
    loading: false,
  })),
  on(JanitorActions.loadMyJobsSuccess, (state, { jobs }) => ({
    ...state,
    myJobs: jobs,
    loading: false,
  })),
  on(JanitorActions.loadJobDetailSuccess, (state, { report }) => ({
    ...state,
    selectedReport: report,
    loading: false,
  })),
  on(JanitorActions.acceptReportSuccess, (state, { report }) => ({
    ...state,
    openReports: state.openReports.filter((r) => r.id !== report.id),
    myJobs: [report, ...state.myJobs],
    selectedReport: state.selectedReport?.id === report.id ? report : state.selectedReport,
    loading: false,
  })),
  on(JanitorActions.setTimeEstimateSuccess, JanitorActions.updateStatusSuccess, JanitorActions.resumeJobSuccess, (state, { report }) => ({
    ...state,
    myJobs: state.myJobs.map((r) => (r.id === report.id ? report : r)),
    selectedReport: state.selectedReport?.id === report.id ? report : state.selectedReport,
    loading: false,
  })),
  on(JanitorActions.requestSuppliesSuccess, (state, { supplyRequest, report }) => ({
    ...state,
    supplyRequests: [supplyRequest, ...state.supplyRequests],
    myJobs: state.myJobs.map((r) => (r.id === report.id ? report : r)),
    selectedReport: state.selectedReport?.id === report.id ? report : state.selectedReport,
    loading: false,
  })),
  on(
    JanitorActions.loadOpenReportsFailure,
    JanitorActions.loadMyJobsFailure,
    JanitorActions.loadJobDetailFailure,
    JanitorActions.acceptReportFailure,
    JanitorActions.setTimeEstimateFailure,
    JanitorActions.updateStatusFailure,
    JanitorActions.requestSuppliesFailure,
    JanitorActions.resumeJobFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })
  )
);
