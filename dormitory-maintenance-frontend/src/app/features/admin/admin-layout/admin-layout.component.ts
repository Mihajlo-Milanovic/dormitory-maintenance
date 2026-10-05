import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-100">
      <div class="bg-white shadow-xs border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center space-x-8">
              <span class="text-lg font-bold text-gray-900">Admin Control Panel</span>
              <nav class="hidden md:flex space-x-4">
                <a
                  routerLink="/admin/supplies"
                  routerLinkActive="bg-indigo-50 text-indigo-700"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  📦 Supply Queue
                </a>
                <a
                  routerLink="/admin/reassignment"
                  routerLinkActive="bg-indigo-50 text-indigo-700"
                  class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ⚡ Reassignment & Severity
                </a>
                <a
                  routerLink="/admin/users"
                  routerLinkActive="bg-indigo-50 text-indigo-700"
                  class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  👥 User Management
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Sub-navigation for mobile -->
      <div class="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex space-x-2 overflow-x-auto">
        <a routerLink="/admin/supplies" routerLinkActive="bg-indigo-50 text-indigo-700" class="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 shrink-0">Supply Queue</a>
        <a routerLink="/admin/reassignment" routerLinkActive="bg-indigo-50 text-indigo-700" class="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 shrink-0">Reassignment</a>
        <a routerLink="/admin/users" routerLinkActive="bg-indigo-50 text-indigo-700" class="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 shrink-0">Users</a>
      </div>

      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {}
