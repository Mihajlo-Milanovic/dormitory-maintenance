import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, exhaustMap, tap } from 'rxjs/operators';
import { StudentReportService } from '../services/student-report.service';
import { StudentReportActions } from './student-report.actions';
import { Router } from '@angular/router';

@Injectable()
export class StudentReportEffects {
  private readonly actions$ = inject(Actions);
  private readonly studentReportService = inject(StudentReportService);
  private readonly router = inject(Router);

  loadReports$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StudentReportActions.loadReports),
      exhaustMap(() =>
        this.studentReportService.getMyReports().pipe(
          map((reports) => StudentReportActions.loadReportsSuccess({ reports })),
          catchError((error) => of(StudentReportActions.loadReportsFailure({ error: error.message })))
        )
      )
    )
  );

  loadReportDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StudentReportActions.loadReportDetail),
      exhaustMap(({ id }) =>
        this.studentReportService.getReportById(id).pipe(
          map((report) => StudentReportActions.loadReportDetailSuccess({ report })),
          catchError((error) => of(StudentReportActions.loadReportDetailFailure({ error: error.message })))
        )
      )
    )
  );

  createReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StudentReportActions.createReport),
      exhaustMap(({ payload }) =>
        this.studentReportService.createReport(payload).pipe(
          map((report) => StudentReportActions.createReportSuccess({ report })),
          catchError((error) => of(StudentReportActions.createReportFailure({ error: error.message })))
        )
      )
    )
  );

  createReportSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(StudentReportActions.createReportSuccess),
        tap(() => {
          this.router.navigate(['/student']);
        })
      ),
    { dispatch: false }
  );

  cancelReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StudentReportActions.cancelReport),
      exhaustMap(({ id }) =>
        this.studentReportService.cancelReport(id).pipe(
          map((report) => StudentReportActions.cancelReportSuccess({ report })),
          catchError((error) => of(StudentReportActions.cancelReportFailure({ error: error.message })))
        )
      )
    )
  );
}
