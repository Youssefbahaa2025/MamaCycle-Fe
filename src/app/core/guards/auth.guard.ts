import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  // Prevent execution during server-side rendering
  if (typeof window === 'undefined') return false;

  // Safely check for token in localStorage
  let token = null;
  if (typeof localStorage !== 'undefined') {
    try {
      token = localStorage.getItem('mamaToken');
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
  }

  // If token exists, allow access
  if (token) return true;

  // If not logged in, redirect to login page
  const router = inject(Router);
  router.navigate(['/login']);
  return false;
};
