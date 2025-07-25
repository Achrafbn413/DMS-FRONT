import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../services/transaction.service';
import { Transaction, TransactionWithMeta } from '../models/transaction.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-user-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-transactions.component.html',
  styleUrls: ['./user-transactions.component.css']
})
export class UserTransactionsComponent implements OnInit {
  // ✅ CORRIGÉ : Utilise TransactionWithMeta[] qui correspond au service
  transactions: TransactionWithMeta[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Chargement des transactions avec gestion d'erreur
   */
  loadTransactions(): void {
    this.isLoading = true;
    this.error = null;

    // ✅ CORRIGÉ : Utilise getAllTransactions() au lieu de getMesTransactions()
    this.transactionService.getAllTransactions().subscribe({
      // ✅ CORRIGÉ : Types explicites pour les paramètres
      next: (data: TransactionWithMeta[]) => {
        this.transactions = data;
        this.isLoading = false;
        console.log('[SUCCESS] Transactions chargées:', data.length);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[ERROR] Erreur lors du chargement des transactions:', err);
        this.error = 'Erreur lors du chargement des transactions';
        this.isLoading = false;
        
        // Fallback : essayer les transactions simples si l'authentification échoue
        if (err.status === 401 || err.status === 403) {
          console.log('[INFO] Tentative de chargement des transactions simples...');
          this.loadSimpleTransactions();
        }
      }
    });
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Fallback pour transactions simples
   */
  private loadSimpleTransactions(): void {
    this.transactionService.getAllTransactionsSimple().subscribe({
      next: (data: TransactionWithMeta[]) => {
        this.transactions = data;
        this.isLoading = false;
        console.log('[SUCCESS] Transactions simples chargées:', data.length);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[ERROR] Erreur chargement transactions simples:', err);
        this.error = 'Impossible de charger les transactions';
        this.isLoading = false;
      }
    });
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Rafraîchir les données
   */
  refreshTransactions(): void {
    this.loadTransactions();
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Formater la devise
   */
  formatCurrency(amount: number | undefined): string {
    if (!amount && amount !== 0) return '0,00 MAD';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Formater la date
   */
  formatDate(date: string | undefined): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch {
      return date;
    }
  }
}