// 1. MODIFICATION DU NotificationService (notification.service.ts)
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

export interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  notification$ = this.notificationSubject.asObservable();

  // NOUVELLE PROPRIÉTÉ pour les notifications non lues
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  showSuccess(message: string, duration = 3000) {
    this.notificationSubject.next({ type: 'success', message, duration });
  }

  showError(message: string, duration = 5000) {
    this.notificationSubject.next({ type: 'error', message, duration });
  }

  showWarning(message: string, duration = 4000) {
    this.notificationSubject.next({ type: 'warning', message, duration });
  }

  showInfo(message: string, duration = 3000) {
    this.notificationSubject.next({ type: 'info', message, duration });
  }

  // NOUVELLE MÉTHODE pour mettre à jour le compteur
  updateUnreadCount(count: number) {
    this.unreadCountSubject.next(count);
  }

  // NOUVELLE MÉTHODE pour récupérer le compteur actuel
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}