import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Report, CreateReportRequest } from '../../../shared/models/report.model';

export const StudentReportActions = createActionGroup({
  source: 'Student Report',
  events: {
    'Load Reports': emptyProps(),
    'Load Reports Success': props<{ reports: Report[] }>(),
    'Load Reports Failure': props<{ error: string }>(),

    'Load Report Detail': props<{ id: string }>(),
    'Load Report Detail Success': props<{ report: Report }>(),
    'Load Report Detail Failure': props<{ error: string }>(),

    'Create Report': props<{ payload: CreateReportRequest }>(),
    'Create Report Success': props<{ report: Report }>(),
    'Create Report Failure': props<{ error: string }>(),

    'Cancel Report': props<{ id: string }>(),
    'Cancel Report Success': props<{ report: Report }>(),
    'Cancel Report Failure': props<{ error: string }>(),
  },
});
