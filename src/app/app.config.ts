// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxSpinnerModule } from 'ngx-spinner';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { messageInterceptor } from './core/interceptors/message.interceptor';

// 👇 NEW: ngx-translate imports
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

console.log('Current environment:', environment);
console.log('API URL:', environment.apiUrl);
console.log('Asset URL:', environment.assetUrl);
console.log('Production mode:', environment.production);

// 👇 NEW: HttpLoaderFactory for translations
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    // 1️⃣ import spinner module + animations (global defaults only need `type`)
    importProvidersFrom(
      BrowserAnimationsModule,
      NgxSpinnerModule.forRoot({
        type: 'ball-scale-multiple'
      }),

      // ✅ ngx-translate module setup
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        useDefaultLang: true,
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ),

    // 2️⃣ single HttpClient with auth, loading, and message interceptors
    provideHttpClient(
      withInterceptors([authInterceptor, loadingInterceptor, messageInterceptor])
    ),

    // 3️⃣ router & toastr
    provideRouter(routes),
    provideToastr()
  ]
};
