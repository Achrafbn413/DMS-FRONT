import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserService } from './admin-user.service';

import { Utilisateur, RoleUtilisateur } from '../../models/user.model';
import { Institution } from '../../models/institution.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None
})
export class AdminUsersComponent implements OnInit {
  utilisateurs: Utilisateur[] = [];
  institutions: Institution[] = [];
  selectedUser: Utilisateur = {
    nom: '',
    email: '',
    role: RoleUtilisateur.USER, // ✅ CORRECTION : Utilise l'enum
    enabled: true,
    institution: undefined
  };
  searchTerm: string = '';
  isLoading = false;
  isFormVisible = false;
  isEditing = false;
  showConfirmDialog = false;
  userToDelete: number | null = null;
  totalUsers = 0;
  activeUsers = 0;
  errorMessage = '';
  successMessage = '';

  constructor(private adminUserService: AdminUserService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.fetchUsers();
    this.fetchInstitutions();
  }

  fetchUsers(): void {
    this.adminUserService.getAllUsers().subscribe({
      next: (data) => {
        this.utilisateurs = data;
        this.totalUsers = data.length;
        this.activeUsers = data.filter(u => u.enabled).length;
        console.log('✅ Utilisateurs récupérés :', data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur de récupération des utilisateurs :', err);
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.isLoading = false;
      }
    });
  }

  fetchInstitutions(): void {
    this.adminUserService.getInstitutions().subscribe({
      next: (data) => {
        this.institutions = data;
      },
      error: (err) => {
        console.error('❌ Erreur institutions :', err);
        this.errorMessage = 'Erreur lors du chargement des institutions';
      }
    });
  }

  get utilisateursFiltres(): Utilisateur[] {
    if (!this.searchTerm) return this.utilisateurs;
    
    return this.utilisateurs.filter(user =>
      user.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (user.institution?.nom || '').toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  saveUser(): void {
    if (!this.selectedUser.nom || !this.selectedUser.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    if (this.selectedUser.id) {
      this.adminUserService.updateUser(this.selectedUser.id, this.selectedUser).subscribe({
        next: () => {
          this.successMessage = 'Utilisateur mis à jour avec succès';
          this.fetchUsers();
          this.resetForm();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la mise à jour';
          this.isLoading = false;
        }
      });
    } else {
      this.adminUserService.createUser(this.selectedUser).subscribe({
        next: () => {
          this.successMessage = 'Utilisateur créé avec succès';
          this.fetchUsers();
          this.resetForm();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la création';
          this.isLoading = false;
        }
      });
    }
  }

  editUser(user: Utilisateur): void {
    this.selectedUser = { ...user };
    this.isEditing = true;
    this.isFormVisible = true;
    this.clearMessages();
  }

  confirmDeactivate(id: number): void {
    this.userToDelete = id;
    this.showConfirmDialog = true;
  }

  deactivateUser(): void {
    if (this.userToDelete) {
      this.adminUserService.deactivateUser(this.userToDelete).subscribe({
        next: () => {
          this.successMessage = 'Utilisateur désactivé avec succès';
          this.fetchUsers();
          this.closeConfirmDialog();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la désactivation';
          this.closeConfirmDialog();
        }
      });
    }
  }

  reactivateUser(id?: number): void {
    if (id) {
      this.adminUserService.reactivateUser(id).subscribe({
        next: () => {
          this.successMessage = 'Utilisateur réactivé avec succès';
          this.fetchUsers();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la réactivation';
        }
      });
    }
  }

  resetForm(): void {
    this.selectedUser = {
      nom: '',
      email: '',
      role: RoleUtilisateur.USER, // ✅ CORRECTION : Utilise l'enum
      enabled: true,
      institution: undefined
    };
    this.isEditing = false;
    this.isFormVisible = false;
    this.isLoading = false;
  }

  showForm(): void {
    this.isFormVisible = true;
    this.isEditing = false;
    this.clearMessages();
  }

  hideForm(): void {
    this.resetForm();
  }

  closeConfirmDialog(): void {
    this.showConfirmDialog = false;
    this.userToDelete = null;
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  refreshData(): void {
    this.clearMessages();
    this.loadData();
  }

  getUserStatusIcon(user: Utilisateur): string {
    return user.enabled ? '✅' : '❌';
  }

  getUserStatusText(user: Utilisateur): string {
    return user.enabled ? 'Actif' : 'Inactif';
  }

  getRoleIcon(role: string): string {
    return role === 'ADMIN' ? '👑' : '👤';
  }

  getRoleText(role: string): string {
    return role === 'ADMIN' ? 'Administrateur' : 'Utilisateur';
  }
}