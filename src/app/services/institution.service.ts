// src/app/services/institution.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Institution } from '../models/institution.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  private apiUrl = 'http://localhost:8080/api/admin/institutions';

  constructor(private http: HttpClient) {}

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
  
}
