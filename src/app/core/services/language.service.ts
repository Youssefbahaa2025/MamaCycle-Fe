import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private currentLang = new BehaviorSubject<string>('en');
    currentLang$ = this.currentLang.asObservable();
    private isBrowser: boolean;

    constructor(
        private translate: TranslateService,
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

        // Add debug logging
        this.translate.onLangChange.subscribe(event => {
            console.log('Language changed to:', event.lang);
            console.log('Current translations:', this.translate.instant('rent'));
        });
    }

    setLanguage(lang: string) {
        console.log('Setting language to:', lang);
        this.translate.use(lang).subscribe(
            () => {
                console.log('Sample translation:', this.translate.instant('rent.title'));
            },
            error => {
                console.error('Error loading language:', error);
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