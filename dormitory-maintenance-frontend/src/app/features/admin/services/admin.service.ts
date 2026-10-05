import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SupplyRequest, SupplyStatus } from '../../../shared/models/supply.model';
import { Report, ReportSeverity } from '../../../shared/models/report.model';
import { User } from '../../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly api = inject(ApiService);

  getSupplyRequests(): Observable<SupplyRequest[]> {
    return this.api.get<SupplyRequest[]>('supplies');
  }

  updateSupplyRequest(id: string, payload: { status: SupplyStatus; arrivalAt?: string }): Observable<SupplyRequest> {
    return this.api.patch<SupplyRequest>(`supplies/${id}`, payload);
  }

  getAllReports(): Observable<Report[]> {
    return this.api.get<Report[]>('reports');
  }

  reassignReport(reportId: string, janitorId: string): Observable<Report> {
    return this.api.post<Report>(`reports/${reportId}/reassign`, { janitorId });
  }

  updateSeverity(reportId: string, severity: ReportSeverity, comment?: string): Observable<Report> {
    return this.api.patch<Report>(`reports/${reportId}/severity`, { severity, comment });
  }

  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('users');
  }

  createUser(payload: Partial<User>): Observable<User> {
    return this.api.post<User>('users', payload);
  }

  importUsersCsv(csvData: string): Observable<any> {
    return this.api.post<any>('users/bulk', { csv: csvData });
  }

  updateUser(id: string, payload: Partial<User>): Observable<User> {
    return this.api.patch<User>(`users/${id}`, payload);
  }
}
