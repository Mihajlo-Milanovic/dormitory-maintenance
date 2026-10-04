import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StudentReportState } from './student-report.state';

export const selectStudentReportState = createFeatureSelector<StudentReportState>('studentReports');

export const selectAllStudentReports = createSelector(
  selectStudentReportState,
  (state) => state.reports
);

export const selectSelectedReport = createSelector(
  selectStudentReportState,
  (state) => state.selectedReport
);

export const selectStudentReportLoading = createSelector(
  selectStudentReportState,
  (state) => state.loading
);

export const selectStudentReportError = createSelector(
  selectStudentReportState,
  (state) => state.error
);
