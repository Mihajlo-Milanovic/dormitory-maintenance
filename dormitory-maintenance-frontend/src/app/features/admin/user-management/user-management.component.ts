import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { User, UserRole, JanitorSpecialization } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  protected users: User[] = [];
  protected loading = false;
  protected error: string | null = null;

  // Single user creation form state
  protected showCreateForm = false;
  protected newName = '';
  protected newEmail = '';
  protected newRole: UserRole = 'student';
  protected newSpecialization: JanitorSpecialization = 'plumbing';

  // CSV bulk import state
  protected showCsvImport = false;
  protected csvText = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load users.';
        this.loading = false;
      },
    });
  }

  createUser(): void {
    if (!this.newName || !this.newEmail) {
      alert('Please fill in name and email.');
      return;
    }
    const payload: Partial<User> = {
      name: this.newName,
      email: this.newEmail,
      role: this.newRole,
      specialization: this.newRole === 'janitor' ? this.newSpecialization : undefined,
    };
    this.adminService.createUser(payload).subscribe({
      next: (created) => {
        this.users = [created, ...this.users];
        this.newName = '';
        this.newEmail = '';
        this.showCreateForm = false;
        alert('User created successfully.');
      },
      error: (err) => {
        alert(err.error?.message || err.message || 'Failed to create user.');
      },
    });
  }

  importCsv(): void {
    if (!this.csvText) {
      alert('Please enter CSV data.');
      return;
    }
    this.adminService.importUsersCsv(this.csvText).subscribe({
      next: () => {
        this.csvText = '';
        this.showCsvImport = false;
        alert('Users imported successfully.');
        this.loadUsers();
      },
      error: (err) => {
        alert(err.error?.message || err.message || 'Failed to import CSV.');
      },
    });
  }

  toggleActive(user: User): void {
    this.adminService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
      next: (updated) => {
        this.users = this.users.map((u) => (u.id === user.id ? updated : u));
      },
      error: (err) => {
        alert(err.error?.message || err.message || 'Failed to update user status.');
      },
    });
  }
}
