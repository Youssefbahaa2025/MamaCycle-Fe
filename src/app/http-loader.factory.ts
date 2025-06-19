import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

/**
 * Factory function for TranslateHttpLoader that handles both SSR and browser environments
 */
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
    // Use explicit relative path to ensure it works on Vercel
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
