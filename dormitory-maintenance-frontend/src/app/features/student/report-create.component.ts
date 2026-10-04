import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { StudentReportActions } from './state/student-report.actions';
import { selectStudentReportLoading } from './state/student-report.selectors';
import { ReportCategory, ReportSeverity } from '../../shared/models/report.model';

@Component({
  selector: 'app-report-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrl: './report-create.component.css',
  templateUrl: './report-create.component.html',
})
export class ReportCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  protected readonly categories: ReportCategory[] = ['plumbing', 'electrical', 'furniture', 'heating', 'other'];
  protected readonly severities: ReportSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

  protected readonly loading$ = this.store.select(selectStudentReportLoading);

  protected readonly reportForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    category: ['plumbing', [Validators.required]],
    severity: ['Medium', [Validators.required]],
    location: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    photoUrl: [''],
  });

  protected onSubmit(): void {
    if (this.reportForm.valid) {
      const val = this.reportForm.value;
      this.store.dispatch(
        StudentReportActions.createReport({
          payload: {
            title: val.title!,
            category: val.category as ReportCategory,
            severity: val.severity as ReportSeverity,
            location: val.location!,
            description: val.description!,
            photoUrl: val.photoUrl || undefined,
          },
        })
      );
    }
  }
}
