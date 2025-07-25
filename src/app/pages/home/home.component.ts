import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/NavigationService';
import { ParticlesDirective } from '../../directives/particles.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, ParticlesDirective],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None // ✅ Désactive l'encapsulation pour éliminer le cadre blanc
})
export class HomeComponent {
  sidebarClosed = false;

  constructor(private navigationService: NavigationService) {}

  toggleSidebar() {
    this.sidebarClosed = !this.sidebarClosed;
  }

  navigateTo(route: string) {
    this.navigationService.navigateTo(route);
  }

  // Méthodes pour les boutons CTA
  onSignUp() {
    this.navigationService.navigateTo('/signup');
  }

  onLogin() {
    this.navigationService.navigateTo('/login');
  }

  onDemo() {
    this.navigationService.navigateTo('/demo');
  }

  onGetStarted() {
    this.navigationService.navigateTo('/signup');
  }
}