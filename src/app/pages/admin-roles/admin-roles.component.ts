import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-roles">
      <h2>🔑 Gestion des rôles</h2>
      <p>Interface à venir...</p>
    </div>
  `,
  styleUrls: ['./admin-roles.component.css']
})
export class AdminRolesComponent {}
