import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  imports: [RouterLink],
  selector: 'app-not-found',
  standalone: true,
  styleUrl: './not-found.component.css',
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {
  private location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
