// ========== admin-home.component.ts ==========
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

interface DashboardStats {
  totalUsers: number;
  totalInstitutions: number;
  totalTransactions: number;
  totalLitiges: number;
  activeUsers: number;
  pendingLitiges: number;
}

interface QuickAction {
  title: string;
  icon: string;
  route: string;
  description: string;
  color: string;
  count?: number;
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AdminHomeComponent implements OnInit {
  
  stats: DashboardStats = {
    totalUsers: 0,
    totalInstitutions: 0,
    totalTransactions: 0,
    totalLitiges: 0,
    activeUsers: 0,
    pendingLitiges: 0
  };

  quickActions: QuickAction[] = [
    {
      title: 'Gestion des utilisateurs',
      icon: '👥',
      route: '/admin/users',
      description: 'Créer, modifier et gérer les comptes utilisateurs',
      color: '#1976d2'
    },
    {
      title: 'Gestion des institutions',
      icon: '🏦',
      route: '/admin/institutions',
      description: 'Configuration des banques et institutions financières',
      color: '#2e7d32'
    },
    {
      title: 'Gestion des litiges',
      icon: '⚠️',
      route: '/admin/litiges',
      description: 'Résolution et suivi des litiges signalés',
      color: '#d32f2f'
    },
    {
      title: 'Gestion des arbitrages',
      icon: '⚖️',
      route: '/admin/arbitrages',
      description: 'Décisions d arbitrage et résolution des litiges',
      color: '#673ab7'
    },
    {
      title: 'Surveillance des transactions',
      icon: '💳',
      route: '/admin/transactions',
      description: 'Monitoring et analyse des transactions',
      color: '#f57c00'
    },
    {
      title: 'Gestion des rôles',
      icon: '🔐',
      route: '/admin/roles',
      description: 'Configuration des permissions et accès',
      color: '#7b1fa2'
    }
  ];

  recentActivities = [
    {
      type: 'user',
      message: 'Nouvel utilisateur créé: Ahmed Alami',
      time: '2 minutes',
      icon: '👤'
    },
    {
      type: 'litige',
      message: 'Nouveau litige signalé - Transaction #TXN001234',
      time: '15 minutes',
      icon: '🚨'
    },
    {
      type: 'institution',
      message: 'Institution BMCE mise à jour',
      time: '1 heure',
      icon: '🏦'
    },
    {
      type: 'system',
      message: 'Sauvegarde automatique effectuée',
      time: '2 heures',
      icon: '💾'
    }
  ];

  isLoading = true;
  currentUser: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadDashboardStats();
  }

  private loadUserInfo(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        console.log('✅ User info loaded:', this.currentUser);
      } catch (error) {
        console.error('❌ Erreur parsing user data:', error);
      }
    }
  }

  private loadDashboardStats(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('⚠️ No token found');
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('🔄 Loading dashboard stats...');

    // Simulation de chargement des stats - À remplacer par de vrais appels API
    setTimeout(() => {
      try {
        this.stats = {
          totalUsers: 45,
          totalInstitutions: 8,
          totalTransactions: 1247,
          totalLitiges: 23,
          activeUsers: 38,
          pendingLitiges: 12
        };

        // ✅ FIXED: Vérifier que l'index existe avant d'assigner
        if (this.quickActions[0]) this.quickActions[0].count = this.stats.totalUsers;
        if (this.quickActions[1]) this.quickActions[1].count = this.stats.totalInstitutions;
        if (this.quickActions[2]) this.quickActions[2].count = this.stats.totalLitiges; // ✅ FIXED: Utiliser totalLitiges au lieu de totalTransactions
        if (this.quickActions[3]) this.quickActions[3].count = this.stats.pendingLitiges;
        if (this.quickActions[4]) this.quickActions[4].count = this.stats.totalTransactions; // ✅ FIXED: Transactions pour l'index 4
        if (this.quickActions[5]) this.quickActions[5].count = 5; // Nombre de rôles (temporaire)

        console.log('✅ Dashboard stats loaded successfully');
        this.isLoading = false;
      } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
        this.isLoading = false;
      }
    }, 1000);
  }

  refreshStats(): void {
    console.log('🔄 Refreshing stats...');
    this.isLoading = true;
    this.loadDashboardStats();
  }

  getUserGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'user': '👤',
      'litige': '🚨',
      'institution': '🏦',
      'system': '💾',
      'transaction': '💳'
    };
    return icons[type] || '📌';
  }

  // ✅ Nouvelle méthode pour gérer les événements de façon sécurisée
  handleSecureEvent(event: Event, callback: () => void): void {
    if (event.isTrusted) {
      callback();
    } else {
      console.warn('⚠️ Untrusted event blocked:', event);
    }
  }

  // ✅ TrackBy functions pour améliorer les performances d'Angular
  trackByActionTitle(index: number, action: QuickAction): string {
    return action.title;
  }

  trackByActivityMessage(index: number, activity: any): string {
    return activity.message;
  }

  // ✅ Navigation programmatique pour l'accessibilité
  navigateToAction(route: string): void {
    // Cette méthode sera utilisée pour la navigation au clavier
    window.location.href = route;
  }

  // ✅ Méthodes pour les actions d'urgence
  performBackup(): void {
    console.log('🔄 Début de la sauvegarde d\'urgence...');
    // TODO: Implémenter la logique de sauvegarde
    alert('Sauvegarde d\'urgence initiée avec succès !');
  }

  toggleMaintenanceMode(): void {
    console.log('🛠️ Basculement du mode maintenance...');
    // TODO: Implémenter la logique du mode maintenance
    const isMaintenanceMode = confirm('Voulez-vous vraiment activer le mode maintenance ?');
    if (isMaintenanceMode) {
      alert('Mode maintenance activé !');
    }
  }
}