import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Litige } from '../models/litige.model';
import { LitigeDetailsResponse } from '../models/litige-details.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LitigeService {
  
  private apiUrl = 'http://localhost:8080/api/public/litiges';
  
  constructor(private http: HttpClient, private authService: AuthService) {}
  
  getLitigesPourAcquereur(): Observable<Litige[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Litige[]>('http://localhost:8080/api/litiges/acquereur', { headers });
  }
  
  getAllLitiges(): Observable<Litige[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<Litige[]>(`${this.apiUrl}`, { headers }).pipe(
      catchError(err => {
        console.error('Erreur LitigeService:', err);
        return throwError(() => new Error('Erreur lors de la récupération des litiges.'));
      })
    );
  }
  
  /**
   * ✅ CORRIGÉ : Récupérer les IDs des transactions signalées par l'utilisateur courant
   */
  getTransactionIdsSignaledByUser(): Observable<number[]> {
    const token = this.authService.getToken();
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      console.error('[ERROR] Utilisateur non connecté');
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    
    let user;
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      console.error('[ERROR] Erreur parsing user data:', error);
      return throwError(() => new Error('Données utilisateur corrompues'));
    }
    
    if (!user.id) {
      console.error('[ERROR] ID utilisateur manquant');
      return throwError(() => new Error('ID utilisateur manquant'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<number[]>(`${this.apiUrl}/by-user/${user.id}`, { headers }).pipe(
      catchError(err => {
        console.error('[ERROR] Erreur récupération transactions signalées:', err);
        return throwError(() => new Error('Erreur lors de la récupération des transactions signalées.'));
      })
    );
  }

  // ====================================================================
  // 🆕 NOUVELLE MÉTHODE POUR FONCTIONNALITÉ DÉTAILS LITIGE
  // ====================================================================

  /**
   * ✅ NOUVELLE MÉTHODE : Récupérer les détails complets d'un litige
   */
  getLitigeDetails(litigeId: number): Observable<LitigeDetailsResponse> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<LitigeDetailsResponse>(`${this.apiUrl}/details/${litigeId}`, { headers }).pipe(
      catchError(err => {
        console.error('[ERROR] Erreur récupération détails litige:', err);
        return throwError(() => new Error('Erreur lors de la récupération des détails du litige.'));
      })
    );
  }
  
}