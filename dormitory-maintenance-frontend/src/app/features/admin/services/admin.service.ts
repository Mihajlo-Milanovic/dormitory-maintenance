import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SupplyRequest, SupplyStatus } from '../../../shared/models/supply.model';
import { Report } from '../../../shared/models/report.model';

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
}
