import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Report, CreateReportRequest } from '../../../shared/models/report.model';

@Injectable({
  providedIn: 'root',
})
export class StudentReportService {
  private readonly api = inject(ApiService);

  getMyReports(): Observable<Report[]> {
    return this.api.get<Report[]>('reports/my');
  }

  getReportById(id: string): Observable<Report> {
    return this.api.get<Report>(`reports/${id}`);
  }

  createReport(payload: CreateReportRequest): Observable<Report> {
    return this.api.post<Report>('reports', payload);
  }

  updateReport(id: string, payload: Partial<CreateReportRequest>): Observable<Report> {
    return this.api.patch<Report>(`reports/${id}`, payload);
  }

  cancelReport(id: string): Observable<Report> {
    return this.api.post<Report>(`reports/${id}/cancel`, {});
  }
}
