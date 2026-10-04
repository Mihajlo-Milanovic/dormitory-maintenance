import { createFeatureSelector, createSelector } from '@ngrx/store';
import { JanitorState } from './janitor.state';

export const selectJanitorState = createFeatureSelector<JanitorState>('janitor');

export const selectOpenReports = createSelector(
  selectJanitorState,
  (state) => state.openReports
);

export const selectMyJobs = createSelector(
  selectJanitorState,
  (state) => state.myJobs
);

export const selectSelectedJob = createSelector(
  selectJanitorState,
  (state) => state.selectedReport
);

export const selectJanitorLoading = createSelector(
  selectJanitorState,
  (state) => state.loading
);

export const selectJanitorError = createSelector(
  selectJanitorState,
  (state) => state.error
);

export const selectActiveJob = createSelector(
  selectMyJobs,
  (jobs) => jobs.find((job) => job.status === 'Accepted' || job.status === 'Repair in progress') || null
);
