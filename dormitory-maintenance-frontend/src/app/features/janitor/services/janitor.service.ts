import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Report, ReportStatus } from '../../../shared/models/report.model';
import { SupplyRequest, CreateSupplyRequestDto } from '../../../shared/models/supply.model';

@Injectable({
  providedIn: 'root',
})
export class JanitorService {
  private readonly api = inject(ApiService);

  getOpenReports(): Observable<Report[]> {
    return this.api.get<Report[]>('reports/open');
  }

  getMyJobs(): Observable<Report[]> {
    return this.api.get<Report[]>('reports/janitor');
  }

  getReportById(id: string): Observable<Report> {
    return this.api.get<Report>(`reports/${id}`);
  }

  acceptReport(id: string): Observable<Report> {
    return this.api.post<Report>(`reports/${id}/accept`, {});
  }

  setTimeEstimate(id: string, minutes: number, justification?: string): Observable<Report> {
    return this.api.post<Report>(`reports/${id}/estimate`, { minutes, justification });
  }

  updateStatus(id: string, status: ReportStatus, comment?: string): Observable<Report> {
    return this.api.post<Report>(`reports/${id}/status`, { status, comment });
  }

  requestSupplies(payload: CreateSupplyRequestDto): Observable<SupplyRequest> {
    return this.api.post<SupplyRequest>('supplies', payload);
  }

  resumeJob(id: string): Observable<Report> {
    return this.api.post<Report>(`reports/${id}/resume`, {});
  }
}
