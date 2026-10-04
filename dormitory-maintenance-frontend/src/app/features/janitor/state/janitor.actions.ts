import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Report, ReportStatus } from '../../../shared/models/report.model';
import { SupplyRequest, CreateSupplyRequestDto } from '../../../shared/models/supply.model';

export const JanitorActions = createActionGroup({
  source: 'Janitor',
  events: {
    'Load Open Reports': emptyProps(),
    'Load Open Reports Success': props<{ reports: Report[] }>(),
    'Load Open Reports Failure': props<{ error: string }>(),

    'Load My Jobs': emptyProps(),
    'Load My Jobs Success': props<{ jobs: Report[] }>(),
    'Load My Jobs Failure': props<{ error: string }>(),

    'Load Job Detail': props<{ id: string }>(),
    'Load Job Detail Success': props<{ report: Report }>(),
    'Load Job Detail Failure': props<{ error: string }>(),

    'Accept Report': props<{ id: string }>(),
    'Accept Report Success': props<{ report: Report }>(),
    'Accept Report Failure': props<{ error: string }>(),

    'Set Time Estimate': props<{ id: string; minutes: number; justification?: string }>(),
    'Set Time Estimate Success': props<{ report: Report }>(),
    'Set Time Estimate Failure': props<{ error: string }>(),

    'Update Status': props<{ id: string; status: ReportStatus; comment?: string }>(),
    'Update Status Success': props<{ report: Report }>(),
    'Update Status Failure': props<{ error: string }>(),

    'Request Supplies': props<{ payload: CreateSupplyRequestDto }>(),
    'Request Supplies Success': props<{ supplyRequest: SupplyRequest; report: Report }>(),
    'Request Supplies Failure': props<{ error: string }>(),

    'Resume Job': props<{ id: string }>(),
    'Resume Job Success': props<{ report: Report }>(),
    'Resume Job Failure': props<{ error: string }>(),
  },
});
