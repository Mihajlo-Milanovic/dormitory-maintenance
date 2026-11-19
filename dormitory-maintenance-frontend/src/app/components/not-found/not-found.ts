import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  imports: [RouterLink],
  selector: 'app-not-found',
  standalone: true,
  styleUrl: 'not-found.css',
  templateUrl: 'not-found.html',
})
export class NotFound {
  private location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
