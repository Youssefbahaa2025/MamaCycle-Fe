import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    let token: string | null = null;

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
        return next(cloned);
    }

    return next(req);
};
