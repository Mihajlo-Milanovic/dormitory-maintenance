import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { StudentReportActions } from '../state/student-report.actions';
import { selectAllStudentReports, selectStudentReportLoading } from '../state/student-report.selectors';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrl: './report-list.component.css',
  templateUrl: './report-list.component.html',
})
export class ReportListComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly reports$ = this.store.select(selectAllStudentReports);
  protected readonly loading$ = this.store.select(selectStudentReportLoading);

  ngOnInit(): void {
    this.store.dispatch(StudentReportActions.loadReports());
  }
}
