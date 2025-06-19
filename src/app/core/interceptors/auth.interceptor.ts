import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    let token: string | null = null;
    const router = inject(Router);

    // Log outgoing requests for debugging
    console.log(`🚀 Request: ${req.method} ${req.url}`);

    // ✅ Check if running in the browser and localStorage is available
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
            token = localStorage.getItem('mamaToken');
        } catch (e) {
            console.error('Error accessing localStorage in interceptor:', e);
        }
    }

    if (token) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        return next(cloned).pipe(
            catchError(error => {
                console.error(`🔴 HTTP Error: ${error.status} on ${req.method} ${req.url}`, error);

                // Handle authentication errors
                if (error.status === 401) {
                    console.log('Authentication error detected, redirecting to login');
                    // Clear tokens and redirect to login
                    if (typeof localStorage !== 'undefined') {
                        localStorage.removeItem('mamaToken');
                        localStorage.removeItem('mamaUser');
                    }
                    router.navigate(['/login']);
                }

                return throwError(() => error);
            })
        );
    }

    // For requests without token
    return next(req).pipe(
        catchError(error => {
            console.error(`🔴 HTTP Error: ${error.status} on ${req.method} ${req.url}`, error);
            return throwError(() => error);
        })
    );
};
