import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard = (expectedRole: string): CanActivateFn => {
  return () => {
    const role = localStorage.getItem('role');
    const router = inject(Router);

    if (role === expectedRole) {
      return true;
    }

    alert('Accès refusé');
    router.navigate(['/login']);
    return false;
  };
};
