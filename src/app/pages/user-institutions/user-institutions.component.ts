import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-user-institutions',
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>🏦 Mes Institutions</h2>
      <p>Bienvenue dans l'espace utilisateur. Cette page affichera les institutions associées à votre niveau d’accès.</p>

      <ul>
        <li>Institution 1</li>
        <li>Institution 2</li>
        <li>Institution 3</li>
      </ul>
    </div>
  `,
  styles: [`
    .container {
      padding: 1rem;
      font-family: Arial;
    }
    h2 {
      color: #2c3e50;
    }
  `]
})
export class UserInstitutionsComponent implements OnInit {
  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }
}
