import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { JanitorActions } from '../state/janitor.actions';
import { selectOpenReports, selectActiveJob, selectJanitorLoading } from '../state/janitor.selectors';
import { selectCurrentUser } from '../../auth/state/auth.selectors';
import { ReportCategory } from '../../../shared/models/report.model';

@Component({
  selector: 'app-janitor-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './janitor-feed.component.html',
  styleUrl: './janitor-feed.component.css',
})
export class JanitorFeedComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly openReports$ = this.store.select(selectOpenReports);
  protected readonly activeJob$ = this.store.select(selectActiveJob);
  protected readonly currentUser$ = this.store.select(selectCurrentUser);
  protected readonly loading$ = this.store.select(selectJanitorLoading);

  protected selectedCategory: string = 'all';
  protected selectedSeverity: string = 'all';
  protected searchLocation: string = '';
  protected errorMessage: string | null = null;

  ngOnInit(): void {
    this.store.dispatch(JanitorActions.loadOpenReports());
    this.store.dispatch(JanitorActions.loadMyJobs());
  }

  onAccept(reportId: string, activeJob: any): void {
    if (activeJob) {
      this.errorMessage = 'You already have an active job. Complete or pause it before accepting a new one.';
      return;
    }
    this.errorMessage = null;
    this.store.dispatch(JanitorActions.acceptReport({ id: reportId }));
  }

  isSpecialized(reportCategory: ReportCategory, userSpecialization?: string): boolean {
    if (!userSpecialization) return false;
    return userSpecialization === 'other' || userSpecialization === reportCategory;
  }
}
