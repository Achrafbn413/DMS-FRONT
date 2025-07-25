import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './guards/role.guard';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // 🔐 AUTH
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent)
  },

  // 🛡️ ADMIN HOME (tableau de bord de choix)
  {
    path: 'admin/home',
    loadComponent: () => import('./pages/admin-home/admin-home.component').then(m => m.AdminHomeComponent),
    canActivate: [authGuard, roleGuard('ADMIN')]
  },

  // 👥 ADMIN USERS
  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
    canActivate: [authGuard, roleGuard('ADMIN')]
  },

  // 🔐 ADMIN ROLES
  {
    path: 'admin/roles',
    loadComponent: () => import('./pages/admin-roles/admin-roles.component').then(m => m.AdminRolesComponent),
    canActivate: [authGuard, roleGuard('ADMIN')]
  },

  // ⚙️ ADMIN SETTINGS
  {
    path: 'admin/settings',
    loadComponent: () => import('./pages/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent),
    canActivate: [authGuard, roleGuard('ADMIN')]
  },

  // 💼 ADMIN TRANSACTIONS (si tu l'utilises)
  {
    path: 'admin/transactions',
    loadComponent: () => import('./pages/transactions/admin-transactions.component').then(m => m.AdminTransactionsComponent),
    canActivate: [authGuard, roleGuard('ADMIN')]
  },

  // 👤 USER ROUTES
  {
    path: 'user',
    loadComponent: () => import('./pages/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent),
    canActivate: [authGuard, roleGuard('USER')]
  },
  {
    path: 'user-dashboard',
    component: UserDashboardComponent
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'admin/institutions',
    loadComponent: () => import('./pages/admin-institutions/admin-institutions.component')
      .then(m => m.AdminInstitutionsComponent),
    canActivate: [authGuard, roleGuard('ADMIN')]
  },
 {
  path: 'institutions',
  loadComponent: () => import('./pages/institutions-redirect/institutions-redirect.component')
    .then(m => m.InstitutionsRedirectComponent),
  canActivate: [authGuard]
},

{
  path: 'user/institutions',
  loadComponent: () =>
    import('./pages/user-institutions/user-institutions.component')
      .then(m => m.UserInstitutionsComponent),
  canActivate: [authGuard, roleGuard('USER')]
},
{
  path: 'user/transactions',
  loadComponent: () =>
    import('./user-transactions/user-transactions.component')
      .then(m => m.UserTransactionsComponent),
  canActivate: [authGuard, roleGuard('USER')]
},
{
  path: 'user/dashboard-banque',
  loadComponent: () =>
    import('./pages/user-dashboards/dashboard-banque/dashboard-banque.component')
      .then(m => m.DashboardBanqueComponent),
  canActivate: [authGuard, roleGuard('USER')]
},


/*
{
  path: 'user/dashboard-centre',
  loadComponent: () => import('./pages/user-dashboards/dashboard-centre.component')
    .then(m => m.DashboardCentreComponent),
  canActivate: [authGuard, roleGuard('USER')]
},
{
  path: 'user/dashboard-agence',
  loadComponent: () => import('./pages/user-dashboards/dashboard-agence.component')
    .then(m => m.DashboardAgenceComponent),
  canActivate: [authGuard, roleGuard('USER')]
},*/

  
];
