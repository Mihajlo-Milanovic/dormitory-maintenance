import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { JanitorActions } from '../state/janitor.actions';
import { selectSelectedJob, selectJanitorLoading } from '../state/janitor.selectors';
import { ReportStatus } from '../../../shared/models/report.model';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css',
})
export class JobDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  protected readonly job$ = this.store.select(selectSelectedJob);
  protected readonly loading$ = this.store.select(selectJanitorLoading);

  protected jobId: string = '';
  protected timeEstimateMinutes: number = 30;
  protected estimateJustification: string = '';
  protected statusComment: string = '';

  protected showSupplyModal: boolean = false;
  protected supplyItem: string = '';
  protected supplyQuantity: number = 1;
  protected supplyJustification: string = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobId = id;
      this.store.dispatch(JanitorActions.loadJobDetail({ id }));
    }
  }

  onAccept(): void {
    this.store.dispatch(JanitorActions.acceptReport({ id: this.jobId }));
  }

  onSaveEstimate(): void {
    if (this.timeEstimateMinutes > 0) {
      this.store.dispatch(JanitorActions.setTimeEstimate({
        id: this.jobId,
        minutes: this.timeEstimateMinutes,
        justification: this.estimateJustification,
      }));
    }
  }

  onUpdateStatus(status: ReportStatus): void {
    this.store.dispatch(JanitorActions.updateStatus({
      id: this.jobId,
      status,
      comment: this.statusComment,
    }));
    this.statusComment = '';
  }

  onSubmitSupplyRequest(): void {
    if (this.supplyItem && this.supplyQuantity > 0) {
      this.store.dispatch(JanitorActions.requestSupplies({
        payload: {
          reportId: this.jobId,
          item: this.supplyItem,
          quantity: this.supplyQuantity,
          justification: this.supplyJustification,
        },
      }));
      this.showSupplyModal = false;
      this.supplyItem = '';
      this.supplyQuantity = 1;
      this.supplyJustification = '';
    }
  }
}
