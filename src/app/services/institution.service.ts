// src/app/services/institution.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Institution } from '../models/institution.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  private apiUrl = 'http://localhost:8080/api/admin/institutions';

  constructor(private http: HttpClient) {}

  // ===== ENDPOINTS ADMIN =====
  getAll(): Observable<Institution[]> {
    return this.http.get<Institution[]>(this.apiUrl);
  }

  create(institution: Institution): Observable<Institution> {
    return this.http.post<Institution>(this.apiUrl, institution);
  }
  
  enable(id: number): Observable<Institution> {
    return this.http.put<Institution>(`${this.apiUrl}/${id}/enable`, {});
  }
  
  disable(id: number): Observable<Institution> {
    return this.http.put<Institution>(`${this.apiUrl}/${id}/disable`, {});
  }
  
  getEnabled(): Observable<Institution[]> {
    return this.http.get<Institution[]>(`${this.apiUrl}/enabled`);
  }

  // ===== ENDPOINTS PUBLICS/UTILISATEUR =====
  /**
   * Récupère les institutions activées via l'endpoint public
   * Utilisé dans les pages utilisateur pour éviter les erreurs 403
   */
  getEnabledForUser(): Observable<Institution[]> {
    return this.http.get<Institution[]>(`${this.apiUrl}/public/enabled`);
  }

  /**
   * Récupère toutes les institutions via l'endpoint public
   */
  getAllForUser(): Observable<Institution[]> {
    return this.http.get<Institution[]>(`${this.apiUrl}/public/all`);
  }
}