import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  signup(nom: string, email: string, password: string, role: string, niveaux: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, {
      nom,
      email,
      password,
      role,
      niveaux
    });
  }
}
