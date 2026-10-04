import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { StudentReportActions } from '../state/student-report.actions';
import { selectSelectedReport, selectStudentReportLoading } from '../state/student-report.selectors';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrl: './report-detail.component.css',
  templateUrl: './report-detail.component.html',
})
export class ReportDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);

  protected readonly report$ = this.store.select(selectSelectedReport);
  protected readonly loading$ = this.store.select(selectStudentReportLoading);
  private reportId: string | null = null;

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('id');
    if (this.reportId) {
      this.store.dispatch(StudentReportActions.loadReportDetail({ id: this.reportId }));
    }
  }

  protected onCancelReport(id: string): void {
    if (confirm('Are you sure you want to cancel this report?')) {
      this.store.dispatch(StudentReportActions.cancelReport({ id }));
    }
  }
}
