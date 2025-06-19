import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private currentLang = new BehaviorSubject<string>('en');
    currentLang$ = this.currentLang.asObservable();
    private isBrowser: boolean;

    constructor(
        private translate: TranslateService,
        private http: HttpClient,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);

        // Set available languages
        this.translate.addLangs(['en', 'ar']);
        this.translate.setDefaultLang('en');

        // Initialize language
        let initialLang = 'en';
        if (this.isBrowser) {
            try {
                const savedLang = localStorage.getItem('preferredLanguage');
                initialLang = savedLang || 'en';
            } catch (error) {
                console.error('Error reading language preference:', error);
            }
        }
        this.setLanguage(initialLang);

        // Preload translations to ensure they're available
        this.preloadTranslations();

        // Add debug logging
        this.translate.onLangChange.subscribe(event => {
            console.log('Language changed to:', event.lang);
            console.log('Current translations available:', this.translate.getLangs());
        });
    }

    private preloadTranslations() {
        // Preload both language files to ensure they're available
        if (this.isBrowser) {
            this.http.get('/assets/i18n/en.json').subscribe(
                data => console.log('English translations loaded'),
                error => console.error('Failed to load English translations:', error)
            );

            this.http.get('/assets/i18n/ar.json').subscribe(
                data => console.log('Arabic translations loaded'),
                error => console.error('Failed to load Arabic translations:', error)
            );
        }
    }

    setLanguage(lang: string) {
        console.log('Setting language to:', lang);
        this.translate.use(lang).subscribe(
            () => {
                console.log('Language set successfully to:', lang);
            },
            error => {
                console.error('Error loading language:', error);
                // Fallback to default language
                if (lang !== 'en') {
                    console.log('Falling back to English');
                    this.translate.use('en');
                }
            }
        );
        this.currentLang.next(lang);

        if (this.isBrowser) {
            try {
                localStorage.setItem('preferredLanguage', lang);
                document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
                document.documentElement.lang = lang;
            } catch (error) {
                console.error('Error saving language preference:', error);
            }
        }
    }

    getCurrentLang(): string {
        return this.currentLang.value;
    }

    toggleLanguage() {
        const newLang = this.getCurrentLang() === 'en' ? 'ar' : 'en';
        this.setLanguage(newLang);
    }
} 