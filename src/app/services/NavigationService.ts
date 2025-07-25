import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(
    private router: Router,
    private location: Location
  ) {}

  navigateTo(route: string): Promise<boolean> {
    return this.router.navigate([route]);
  }

  navigateWithParams(route: string, params: any): Promise<boolean> {
    return this.router.navigate([route], { queryParams: params });
  }

  navigateWithState(route: string, state: any): Promise<boolean> {
    return this.router.navigate([route], { state });
  }

  goBack(): void {
    this.location.back();
  }

  goForward(): void {
    this.location.forward();
  }

  reload(): void {
    window.location.reload();
  }

  getCurrentUrl(): string {
    return this.router.url;
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

  // Méthodes spécifiques à votre application
  navigateToLogin(): Promise<boolean> {
    return this.navigateTo('/login');
  }

  navigateToSignup(): Promise<boolean> {
    return this.navigateTo('/signup');
  }

  navigateToDashboard(): Promise<boolean> {
    return this.navigateTo('/dashboard');
  }

  navigateToSettings(): Promise<boolean> {
    return this.navigateTo('/settings');
  }

  navigateHome(): Promise<boolean> {
    return this.navigateTo('/');
  }
}