import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Institution, TypeInstitution } from '../../models/institution.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-institutions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-institutions.component.html',
  styleUrls: ['./admin-institutions.component.css']
})
export class AdminInstitutionsComponent implements OnInit {
  institutions: Institution[] = [];
  newInstitution: Institution = {
    nom: '',
    type: TypeInstitution.EMETTRICE,
    enabled: true
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchInstitutions();
  }

  fetchInstitutions(): void {
    this.http.get<Institution[]>('http://localhost:8080/api/admin/institutions')
      .subscribe(data => {
        this.institutions = data;
      });
  }

  createInstitution(): void {
    this.http.post<Institution>('http://localhost:8080/api/admin/institutions', this.newInstitution)
      .subscribe(() => {
        this.fetchInstitutions();
        this.newInstitution = {
          nom: '',
          type: TypeInstitution.EMETTRICE,
          enabled: true
        };
      });
  }

  toggleInstitution(inst: Institution): void {
    const url = inst.enabled
      ? `http://localhost:8080/api/admin/institutions/${inst.id}/disable`
      : `http://localhost:8080/api/admin/institutions/${inst.id}/enable`;

    this.http.put(url, {}).subscribe(() => this.fetchInstitutions());
  }

  getTypeLabel(type: TypeInstitution): string {
    return type.toString().replace('_', ' ');
  }

  get typeEntries(): { key: string, value: TypeInstitution }[] {
    return Object.entries(TypeInstitution).map(([key, value]) => ({ key, value }));
  }
}
