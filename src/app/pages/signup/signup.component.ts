import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule], // ✅ Import requis pour ngModel et *ngIf
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  nom = '';
  email = '';
  password = '';
  institutionId = 1;
  niveaux = 'MOYEN';
  role = 'USER';
  loading = false; // ✅ Doit exister dans le composant
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  onSignup() {
    this.loading = true;
    this.errorMessage = '';

    const payload = {
  nom: this.nom,
  email: this.email,
  password: this.password,
  role: 'UTILISATEUR',
  niveaux: this.niveaux,
  institutionId: this.institutionId
};


    this.http.post('http://localhost:8080/api/auth/register', payload).subscribe({
      next: () => {
        alert('✅ Inscription réussie');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMessage = err.error || 'Une erreur est survenue.';
        this.loading = false;
      }
    });
  }
}
