import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatModules } from '@app/core/ui/material-modules';

@Component({
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ...MatModules],
  selector: 'app-admin-layout',
  styleUrl: './admin-layout.scss',
  templateUrl: './admin-layout.html',
})
export class AdminLayout {}
