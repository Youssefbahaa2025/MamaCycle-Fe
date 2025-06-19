import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const user = JSON.parse(localStorage.getItem('mamaUser') || '{}');
  if (user?.role === 'admin') return true;
  alert('Access denied');
  return false;
};
