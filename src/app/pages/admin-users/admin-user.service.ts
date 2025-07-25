import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Utilisateur } from '../../models/user.model';
import { Institution } from '../../models/institution.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  private userUrl = 'http://localhost:8080/api/admin/utilisateurs';
  private institutionUrl = 'http://localhost:8080/api/admin/institutions';
  
  constructor(private http: HttpClient) {}
  
  getAllUsers(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(this.userUrl);
  }
  
  createUser(user: Utilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(this.userUrl, user);
  }
  
  updateUser(id: number, user: Utilisateur): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.userUrl}/${id}`, user);
  }
  
  deactivateUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.userUrl}/${id}`);
  }
  
  reactivateUser(id: number): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.userUrl}/reactiver/${id}`, {});
  }
  
  getInstitutions(): Observable<Institution[]> {
    return this.http.get<Institution[]>(this.institutionUrl);
  }
}