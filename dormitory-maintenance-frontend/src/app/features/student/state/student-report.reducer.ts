import { createReducer, on } from '@ngrx/store';
import { initialStudentReportState } from './student-report.state';
import { StudentReportActions } from './student-report.actions';

export const studentReportReducer = createReducer(
  initialStudentReportState,
  on(StudentReportActions.loadReports, StudentReportActions.createReport, StudentReportActions.cancelReport, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(StudentReportActions.loadReportsSuccess, (state, { reports }) => ({
    ...state,
    reports,
    loading: false,
  })),
  on(StudentReportActions.loadReportDetailSuccess, (state, { report }) => ({
    ...state,
    selectedReport: report,
    loading: false,
  })),
  on(StudentReportActions.createReportSuccess, (state, { report }) => ({
    ...state,
    reports: [report, ...state.reports],
    loading: false,
  })),
  on(StudentReportActions.cancelReportSuccess, (state, { report }) => ({
    ...state,
    reports: state.reports.map((r) => (r.id === report.id ? report : r)),
    selectedReport: state.selectedReport?.id === report.id ? report : state.selectedReport,
    loading: false,
  })),
  on(
    StudentReportActions.loadReportsFailure,
    StudentReportActions.loadReportDetailFailure,
    StudentReportActions.createReportFailure,
    StudentReportActions.cancelReportFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })
  )
);
