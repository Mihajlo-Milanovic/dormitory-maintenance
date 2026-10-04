import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, exhaustMap } from 'rxjs/operators';
import { JanitorService } from '../services/janitor.service';
import { JanitorActions } from './janitor.actions';

@Injectable()
export class JanitorEffects {
  private readonly actions$ = inject(Actions);
  private readonly janitorService = inject(JanitorService);

  loadOpenReports$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JanitorActions.loadOpenReports),
      exhaustMap(() =>
        this.janitorService.getOpenReports().pipe(
          map((reports) => JanitorActions.loadOpenReportsSuccess({ reports })),
          catchError((error) => of(JanitorActions.loadOpenReportsFailure({ error: error.message })))
        )
      )
    )
  );

  loadMyJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JanitorActions.loadMyJobs),
      exhaustMap(() =>
        this.janitorService.getMyJobs().pipe(
          map((jobs) => JanitorActions.loadMyJobsSuccess({ jobs })),
          catchError((error) => of(JanitorActions.loadMyJobsFailure({ error: error.message })))
        )
      )
    )
  );

  loadJobDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JanitorActions.loadJobDetail),
      exhaustMap(({ id }) =>
        this.janitorService.getReportById(id).pipe(
          map((report) => JanitorActions.loadJobDetailSuccess({ report })),
          catchError((error) => of(JanitorActions.loadJobDetailFailure({ error: error.message })))
        )
      )
    )
  );

  acceptReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JanitorActions.acceptReport),
      exhaustMap(({ id }) =>
        this.janitorService.acceptReport(id).pipe(
          map((report) => JanitorActions.acceptReportSuccess({ report })),
          catchError((error) => of(JanitorActions.acceptReportFailure({ error: error.message })))
        )
      )
    )
  );

  setTimeEstimate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JanitorActions.setTimeEstimate),
      exhaustMap(({ id, minutes, justification }) =>
        this.janitorService.setTimeEstimate(id, minutes, justification).pipe(
          map((report) => JanitorActions.setTimeEstimateSuccess({ report })),
          catchError((error) => of(JanitorActions.setTimeEstimateFailure({ error: error.message })))
        )
      )
    )
  );

  updateStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JanitorActions.updateStatus),
      exhaustMap(({ id, status, comment }) =>
        this.janitorService.updateStatus(id, status, comment).pipe(
          map((report) => JanitorActions.updateStatusSuccess({ report })),
          catchError((error) => of(JanitorActions.updateStatusFailure({ error: error.message })))
        )
      )
    )
  );

  requestSupplies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JanitorActions.requestSupplies),
      exhaustMap(({ payload }) =>
        this.janitorService.requestSupplies(payload).pipe(
          exhaustMap((supplyRequest) =>
            this.janitorService.getReportById(payload.reportId).pipe(
              map((report) => JanitorActions.requestSuppliesSuccess({ supplyRequest, report }))
            )
          ),
          catchError((error) => of(JanitorActions.requestSuppliesFailure({ error: error.message })))
        )
      )
    )
  );

  resumeJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JanitorActions.resumeJob),
      exhaustMap(({ id }) =>
        this.janitorService.resumeJob(id).pipe(
          map((report) => JanitorActions.resumeJobSuccess({ report })),
          catchError((error) => of(JanitorActions.resumeJobFailure({ error: error.message })))
        )
      )
    )
  );
}
