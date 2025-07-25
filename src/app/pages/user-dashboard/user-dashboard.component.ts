import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  imports: [CommonModule]
})
export class UserDashboardComponent {
  transactions = [
    { id: 1, dateTransaction: '2024-04-01', montant: 500, type: 'Retrait', statut: 'Valide', reference: 'REF123' },
    { id: 2, dateTransaction: '2024-04-02', montant: 800, type: 'Paiement', statut: 'Litige', reference: 'REF456' }
  ];

  isLitige(t: any): boolean {
    return t.statut === 'Litige';
  }
}