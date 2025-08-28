import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InstitutionService } from '../../services/institution.service';
import { Institution } from '../../models/institution.model';

@Component({
  standalone: true,
  selector: 'app-user-institutions',
  imports: [CommonModule],
  templateUrl: './user-institutions.component.html',
  styleUrls: ['./user-institutions.component.css']
})
export class UserInstitutionsComponent implements OnInit {
  institutions: Institution[] = [];
  loading = true;
  error = '';

  // Mapping des logos pour chaque institution
  institutionLogos: { [key: string]: string } = {
    'ATTIJARIWAFA': 'assets/images/attijariwafa-bankj.jpg',
    'BMCE': 'assets/images/Bank_of_Africa_Logo.png',
    'BANK AL-MAGHRIB': 'assets/images/bankmaghirb.png',
    'CIH BANK': 'assets/images/Cih-bank.png'
  };

  constructor(
    private institutionService: InstitutionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadInstitutions();
  }

  loadInstitutions(): void {
    this.institutionService.getEnabledForUser().subscribe({
      next: (data) => {
        this.institutions = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des institutions:', error);
        this.error = 'Erreur lors du chargement des institutions';
        this.loading = false;
      }
    });
  }

  getTypeLabel(type: string): string {
    switch(type) {
      case 'CENTRE':
        return 'Centre Bancaire';
      case 'PORTEFEUILLE':
        return 'Portefeuille';
      case 'EMETTRICE':
        return 'Émettrice';
      case 'ACQUEREUSE':
        return 'Acquéreuse';
      default:
        return type;
    }
  }

  getInstitutionLogo(nomInstitution: string): string {
    // Recherche par nom exact ou par correspondance partielle
    const upperNom = nomInstitution.toUpperCase();
    
    // Correspondances exactes
    if (this.institutionLogos[upperNom]) {
      return this.institutionLogos[upperNom];
    }
    
    // Correspondances partielles
    if (upperNom.includes('ATTIJARI')) {
      return this.institutionLogos['ATTIJARIWAFA'];
    }
    if (upperNom.includes('BMCE') || upperNom.includes('AFRICA')) {
      return this.institutionLogos['BMCE'];
    }
    if (upperNom.includes('MAGHRIB')) {
      return this.institutionLogos['BANK AL-MAGHRIB'];
    }
    if (upperNom.includes('CIH')) {
      return this.institutionLogos['CIH BANK'];
    }
    
    // Logo par défaut
    return 'assets/images/default-bank.png';
  }

  onInstitutionClick(institution: Institution): void {
    // Vérifier si l'institution est activée
    if (!institution.enabled) {
      return;
    }

    // Stocker l'institution sélectionnée dans le localStorage
    localStorage.setItem('selectedInstitution', JSON.stringify(institution));
    
    // Rediriger vers la page de login avec un paramètre
    this.router.navigate(['/login'], { 
      queryParams: { 
        institution: institution.id,
        institutionName: institution.nom 
      } 
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedInstitution');
    this.router.navigate(['/login']);
  }
}