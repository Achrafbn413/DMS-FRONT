// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(private api: ApiService, private router: Router) {
    console.log('✅ LoginComponent chargé');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  validateForm(): boolean {
    if (!this.email.trim()) {
      this.errorMessage = 'L\'email est requis';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Format d\'email invalide';
      return false;
    }

    if (!this.password.trim()) {
      this.errorMessage = 'Le mot de passe est requis';
      return false;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('✅ Formulaire soumis');
    console.log('📧 Email :', this.email);

    this.api.login(this.email, this.password).subscribe({
      next: (res: any) => {
        console.log('✅ Connexion réussie', res);
        
        // Stockage des données utilisateur
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('niveaux', res.niveaux);
        localStorage.setItem('user', JSON.stringify(res));

        // Redirection selon le rôle
        this.redirectUser(res.role, res.niveaux);
        
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur de connexion :', err);
        this.isLoading = false;
        
        // Gestion des erreurs plus précise
        if (err.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect';
        } else if (err.status === 0) {
          this.errorMessage = 'Erreur de connexion au serveur';
        } else {
          this.errorMessage = 'Une erreur est survenue lors de la connexion';
        }
      }
    });
  }

  private redirectUser(role: string, niveaux: string) {
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/home']);
    } else if (role === 'USER') {
      switch (niveaux) {
        case 'ELEVE':
          this.router.navigate(['/user/dashboard-centre']);
          break;
        case 'MOYEN':
          this.router.navigate(['/user/dashboard-banque']);
          break;
        case 'BAS':
          this.router.navigate(['/user/dashboard-agence']);
          break;
        default:
          this.router.navigate(['/user']);
      }
    }
  }

  onEmailChange() {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  onPasswordChange() {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }
}