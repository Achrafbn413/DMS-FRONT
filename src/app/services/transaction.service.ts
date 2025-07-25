import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Transaction, TransactionWithMeta } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:8080/api/transactions';
  private satimUrl = 'http://localhost:8080/api/satim';

  constructor(private http: HttpClient) {}

  /**
   * ✅ MÉTHODE PRINCIPALE : Récupère toutes les transactions avec statut litiges
   * Correspond à TransactionController.getAllTransactions()
   */
  getAllTransactions(): Observable<TransactionWithMeta[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<TransactionWithMeta[]>(`${this.apiUrl}/with-litiges`, { headers })
      .pipe(
        catchError(error => {
          console.error('[ERROR] Erreur chargement transactions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Transactions pour dashboard sécurisé
   * Correspond à TransactionController.getTransactionsForDashboard()
   */
  getTransactionsForDashboard(): Observable<TransactionWithMeta[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<TransactionWithMeta[]>(`${this.apiUrl}/dashboard`, { headers })
      .pipe(
        catchError(error => {
          console.error('[ERROR] Erreur chargement dashboard transactions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Transactions simples sans authentification
   * Correspond à TransactionController.getAllTransactionsSimple()
   */
  getAllTransactionsSimple(): Observable<TransactionWithMeta[]> {
    return this.http.get<TransactionWithMeta[]>(`${this.apiUrl}/simple`)
      .pipe(
        catchError(error => {
          console.error('[ERROR] Erreur chargement transactions simples:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Transaction par ID
   * Note: Endpoint backend à implémenter si nécessaire
   */
  getTransactionById(id: number): Observable<TransactionWithMeta> {
    const headers = this.getAuthHeaders();
    return this.http.get<TransactionWithMeta>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        catchError(error => {
          console.error('[ERROR] Erreur récupération transaction:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ MÉTHODE EXISTANTE AMÉLIORÉE : Upload avec authentification
   */
  uploadSatimFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = this.getAuthHeaders();
    // Note: pour FormData, ne pas définir Content-Type manuellement
    const headersForUpload = new HttpHeaders({
      'Authorization': headers.get('Authorization') || ''
    });

    return this.http.post(`${this.satimUrl}/upload`, formData, { 
      headers: headersForUpload, 
      responseType: 'text' 
    })
    .pipe(
      catchError(error => {
        console.error('[ERROR] Erreur upload fichier:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Récupération des données SATIM
   */
  getAllSatimTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.satimUrl}/all`)
      .pipe(
        catchError(error => {
          console.error('[ERROR] Erreur récupération SATIM:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ MÉTHODE UTILITAIRE : Headers d'authentification
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!token) {
      console.warn('[WARNING] Aucun token d\'authentification trouvé');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    return !!token;
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Debug - afficher les headers
   */
  debugHeaders(): void {
    const headers = this.getAuthHeaders();
    console.log('[DEBUG] Headers actuels:', headers.keys());
    console.log('[DEBUG] Authorization:', headers.get('Authorization'));
  }
  // ====================================================================
// 🆕 NOUVELLE MÉTHODE POUR FONCTIONNALITÉ DÉTAILS TRANSACTION
// ====================================================================

/**
 * ✅ NOUVELLE MÉTHODE : Récupérer les détails complets d'une transaction
 */
getTransactionDetails(transactionId: number): Observable<any> {
  const headers = this.getAuthHeaders();
  
  return this.http.get<any>(`${this.apiUrl}/details/${transactionId}`, { headers }).pipe(
    catchError(error => {
      console.error('[ERROR] Erreur récupération détails transaction:', error);
      return throwError(() => new Error('Erreur lors de la récupération des détails de la transaction.'));
    })
  );
}
}