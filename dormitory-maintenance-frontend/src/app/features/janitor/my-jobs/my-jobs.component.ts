import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { JanitorActions } from '../state/janitor.actions';
import { selectMyJobs, selectJanitorLoading } from '../state/janitor.selectors';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-jobs.component.html',
  styleUrl: './my-jobs.component.css',
})
export class MyJobsComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly myJobs$ = this.store.select(selectMyJobs);
  protected readonly loading$ = this.store.select(selectJanitorLoading);

  ngOnInit(): void {
    this.store.dispatch(JanitorActions.loadMyJobs());
  }

  onResume(id: string): void {
    this.store.dispatch(JanitorActions.resumeJob({ id }));
  }
}
