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
  encapsulation: ViewEncapsulation.None // ✅ Désactive l'encapsulation CSS
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
      title: 'Surveillance des transactions',
      icon: '💳',
      route: '/admin/transactions',
      description: 'Monitoring et analyse des transactions',
      color: '#f57c00'
    },
    {
      title: 'Gestion des litiges',
      icon: '⚠️',
      route: '/admin/litiges',
      description: 'Résolution et suivi des litiges signalés',
      color: '#d32f2f'
    },
    {
      title: 'Gestion des rôles',
      icon: '🔐',
      route: '/admin/roles',
      description: 'Configuration des permissions et accès',
      color: '#7b1fa2'
    },
    {
      title: 'Paramètres système',
      icon: '⚙️',
      route: '/admin/settings',
      description: 'Configuration générale de l\'application',
      color: '#5d4037'
    },
    {
      title: 'Rapports et analyses',
      icon: '📊',
      route: '/admin/reports',
      description: 'Génération de rapports et statistiques',
      color: '#0288d1'
    },
    {
      title: 'Logs système',
      icon: '📋',
      route: '/admin/logs',
      description: 'Consultation des journaux d\'activité',
      color: '#455a64'
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
      } catch (error) {
        console.error('Erreur parsing user data:', error);
      }
    }
  }

  private loadDashboardStats(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Simulation de chargement des stats - À remplacer par de vrais appels API
    setTimeout(() => {
      this.stats = {
        totalUsers: 45,
        totalInstitutions: 8,
        totalTransactions: 1247,
        totalLitiges: 23,
        activeUsers: 38,
        pendingLitiges: 12
      };

      // Mettre à jour les compteurs dans les actions rapides
      this.quickActions[0].count = this.stats.totalUsers;
      this.quickActions[1].count = this.stats.totalInstitutions;
      this.quickActions[2].count = this.stats.totalTransactions;
      this.quickActions[3].count = this.stats.pendingLitiges;

      this.isLoading = false;
    }, 1000);
  }

  refreshStats(): void {
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
}