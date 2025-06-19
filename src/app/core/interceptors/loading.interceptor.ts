// src/app/core/interceptors/loading.interceptor.ts
import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { SpinnerService } from '../services/spinner.service';

const MIN_SPINNER_TIME_MS = 800;  // <-- how long the spinner should linger

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const spinner = inject(SpinnerService);
    spinner.show();

    return next(req).pipe(
        finalize(() => {
            // delay hiding so the spinner stays visible at least 2 seconds
            setTimeout(() => spinner.hide(), MIN_SPINNER_TIME_MS);
        })
    );
};
