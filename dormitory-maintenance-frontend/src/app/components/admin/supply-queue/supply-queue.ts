import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '@services/admin.service';
import { SupplyRequest, SupplyStatus } from '@models/supply.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-supply-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: 'supply-queue.html',
  styleUrl: 'supply-queue.css',
})
export class SupplyQueue implements OnInit {
  private readonly adminService = inject(AdminService);

  protected supplyRequests: SupplyRequest[] = [];
  protected filteredRequests: SupplyRequest[] = [];
  protected loading = false;
  protected error: string | null = null;
  protected selectedStatusFilter: string = 'all';

  // Map to hold temporary arrival time inputs per supply request ID
  protected arrivalTimes: Record<string, string> = {};

  ngOnInit(): void {
    this.loadSupplyRequests();
  }

  loadSupplyRequests(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getSupplyRequests().subscribe({
      next: (requests) => {
        this.supplyRequests = requests;
        // Initialize arrival times map
        requests.forEach((req) => {
          if (req.arrivalAt) {
            this.arrivalTimes[req.id] = req.arrivalAt;
          }
        });
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load supply requests.';
        this.loading = false;
      },
    });
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter = status;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.selectedStatusFilter === 'all') {
      this.filteredRequests = this.supplyRequests;
    } else {
      this.filteredRequests = this.supplyRequests.filter(
        (r) => r.status.toLowerCase() === this.selectedStatusFilter.toLowerCase(),
      );
    }
  }

  updateStatus(id: string, status: SupplyStatus): void {
    const arrivalAt = this.arrivalTimes[id];
    this.adminService.updateSupplyRequest(id, { status, arrivalAt }).subscribe({
      next: (updated) => {
        this.supplyRequests = this.supplyRequests.map((r) => (r.id === id ? updated : r));
        this.applyFilter();
      },
      error: (err) => {
        alert(err.error?.message || err.message || 'Failed to update supply request.');
      },
    });
  }
}
