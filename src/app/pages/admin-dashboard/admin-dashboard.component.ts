import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // seulement celui-là suffit

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [RouterModule] // inutile d'importer les composants des routes enfants
})
export class AdminDashboardComponent {}
