import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service'; 

@Component({
  standalone: true,
  selector: 'app-institutions-redirect',
  template: `<p>🔁 Redirection en cours...</p>`,
})
export class InstitutionsRedirectComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const user = this.authService.getCurrentUser() as { niveaux: string };

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    switch (user.niveaux) {
      case 'ELEVE':
        this.router.navigate(['/admin/institutions']);
        break;
      case 'MOYEN':
      case 'BAS':
        this.router.navigate(['/user/institutions']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
}
