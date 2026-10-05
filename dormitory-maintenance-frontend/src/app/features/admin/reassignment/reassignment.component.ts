import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { Report, ReportSeverity } from '../../../shared/models/report.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-reassignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reassignment.component.html',
  styleUrl: './reassignment.component.css',
})
export class ReassignmentComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  protected reports: Report[] = [];
  protected janitors: User[] = [];
  protected loading = false;
  protected error: string | null = null;

  // Severity editing state
  protected editingSeverityReportId: string | null = null;
  protected selectedSeverity: ReportSeverity = 'Medium';
  protected severityComment = '';

  // Reassignment state
  protected reassigningReportId: string | null = null;
  protected selectedJanitorId = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getAllReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.loadJanitors();
      },
      error: (err) => {
        this.error = err.message || 'Failed to load reports.';
        this.loading = false;
      },
    });
  }

  loadJanitors(): void {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.janitors = users.filter((u) => u.role === 'janitor' && u.isActive);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load users.';
        this.loading = false;
      },
    });
  }

  startEditSeverity(report: Report): void {
    this.editingSeverityReportId = report.id;
    this.selectedSeverity = report.severity;
    this.severityComment = '';
  }

  cancelEditSeverity(): void {
    this.editingSeverityReportId = null;
  }

  saveSeverity(reportId: string): void {
    this.adminService.updateSeverity(reportId, this.selectedSeverity, this.severityComment).subscribe({
      next: (updated) => {
        this.reports = this.reports.map((r) => (r.id === reportId ? updated : r));
        this.editingSeverityReportId = null;
      },
      error: (err) => {
        alert(err.error?.message || err.message || 'Failed to update severity.');
      },
    });
  }

  startReassign(report: Report): void {
    this.reassigningReportId = report.id;
    this.selectedJanitorId = '';
  }

  cancelReassign(): void {
    this.reassigningReportId = null;
  }

  confirmReassign(reportId: string): void {
    if (!this.selectedJanitorId) {
      alert('Please select a janitor.');
      return;
    }
    this.adminService.reassignReport(reportId, this.selectedJanitorId).subscribe({
      next: (updated) => {
        this.reports = this.reports.map((r) => (r.id === reportId ? updated : r));
        this.reassigningReportId = null;
        alert('Job successfully reassigned.');
      },
      error: (err) => {
        alert(err.error?.message || err.message || 'Failed to reassign job.');
      },
    });
  }

  // Suggest best candidate janitor for a report based on specialization and workload
  getSuggestedJanitor(report: Report): User | undefined {
    // 1. Prefer free janitors or janitors whose specialization matches report category
    const matchingJanitors = this.janitors.filter(
      (j) => j.specialization === report.category || j.specialization === 'other'
    );
    if (matchingJanitors.length > 0) {
      return matchingJanitors[0];
    }
    return this.janitors[0];
  }
}
