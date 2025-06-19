import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  @Input() isDarkMode = false;
  currentYear = new Date().getFullYear();
  email: string = '';
  currentLang: string = 'en';

  constructor(
    private translate: TranslateService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
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
    }
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      if (typeof window !== 'undefined') {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      }
    });
  }

  subscribeNewsletter() {
    if (this.email && this.validateEmail(this.email)) {
      // Here you would integrate with your newsletter service
      console.log('Subscribing email:', this.email);
      alert(this.translate.instant('footer.thankYou'));
      this.email = '';
    } else {
      alert(this.translate.instant('footer.invalidEmail'));
    }
  }

  private validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email.toLowerCase());
  }
}
