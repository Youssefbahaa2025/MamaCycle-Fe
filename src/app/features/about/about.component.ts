import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as AOS from 'aos';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {
  currentLang: string = 'en';

  constructor(
    private translate: TranslateService,
    private languageService: LanguageService
  ) { }

  ngOnInit() {
    this.translate.setDefaultLang('en');
    if (typeof window !== 'undefined') {
      try {
        const savedLang = localStorage.getItem('preferredLanguage') || 'en';
        this.translate.use(savedLang);
        this.currentLang = savedLang;
      } catch (error) {
        this.translate.use('en');
        this.currentLang = 'en';
      }
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });
    }
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      if (typeof window !== 'undefined') {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      }
    });
  }

  // Component is currently static, but we can add methods for any interactive features
}
