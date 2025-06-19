import {
  Component,
  HostListener,        //  ⬅️  NEW – to close menu on ESC
  Input,
  OnInit,
  AfterViewInit,
  Renderer2,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/services/cart/cartservice.service';
import { WishlistService } from '../../core/services/wishlist/wishlist.service';
import { Observable } from 'rxjs';
import * as AOS from 'aos';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, AfterViewInit {
  @Input() isDarkMode = false;
  @Input() isLoggedIn = false;
  @Input() isAdmin = false;

  cartCount$!: Observable<number>;
  wishlistCount$!: Observable<number>;
  unreadNotificationCount$!: Observable<number>;
  mobileMenuOpen = false;        // mobile side‑panel
  scrolled = false;              // to track if page has been scrolled
  isVisible = true;
  lastScrollY = 0;
  private isBrowser: boolean;
  currentLang: string = 'en';

  constructor(
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) platformId: Object,
    private languageService: LanguageService,
    private translate: TranslateService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Initialize translations
    this.translate.setDefaultLang('en');

    if (this.isBrowser) {
      try {
        const savedLang = localStorage.getItem('preferredLanguage') || 'en';
        this.translate.use(savedLang);
        this.currentLang = savedLang;
      } catch (error) {
        console.error('Error reading language preference:', error);
        this.translate.use('en');
        this.currentLang = 'en';
      }

      this.cartCount$ = this.cartService.cartCount$;
      this.wishlistCount$ = this.wishlistService.wishlistCount$;
      this.unreadNotificationCount$ = this.wishlistService.unreadNotificationCount$;

      // Load wishlist data if user is logged in
      if (this.isLoggedIn && !this.isAdmin) {
        this.wishlistService.loadWishlist().subscribe();
        this.wishlistService.getUnreadNotificationCount().subscribe();
      }

      try {
        // Check system preferences for dark mode
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Check stored preference
        const storedDarkMode = localStorage.getItem('darkMode');

        // Set dark mode based on stored preference or system preference
        this.isDarkMode = storedDarkMode
          ? storedDarkMode === 'true'
          : prefersDark;

        // Set the class on document
        document.documentElement.classList.toggle('dark', this.isDarkMode);

        // Initialize AOS animation library
        AOS.init({
          duration: 800,
          easing: 'ease-in-out',
          once: true,
          mirror: false
        });
      } catch (error) {
        console.error('Error initializing dark mode:', error);
      }
    }

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      if (this.isBrowser) {
        try {
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        } catch (error) {
          console.error('Error updating document direction:', error);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Refresh AOS
      setTimeout(() => {
        AOS.refresh();
      }, 100);
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    const currentScrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const halfViewportHeight = viewportHeight / 2;

    // Show navbar when at top or when scrolling up
    if (currentScrollY <= halfViewportHeight || currentScrollY < this.lastScrollY) {
      this.isVisible = true;
    } else {
      this.isVisible = false;
    }

    // Update scrolled state for styling
    this.scrolled = currentScrollY > 50;

    // Update last scroll position
    this.lastScrollY = currentScrollY;
  }

  // ————— Mobile handlers —————
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;

    if (this.isBrowser) {
      // Prevent body scrolling when mobile menu is open
      if (this.mobileMenuOpen) {
        this.renderer.addClass(document.body, 'overflow-hidden');
      } else {
        this.renderer.removeClass(document.body, 'overflow-hidden');
      }

      // Refresh AOS for new visible elements
      setTimeout(() => {
        AOS.refresh();
      }, 100);
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    if (this.isBrowser) {
      this.renderer.removeClass(document.body, 'overflow-hidden');
    }
  }

  // Close mobile menu on ESC
  @HostListener('window:keydown.escape')
  onEsc() {
    if (this.isBrowser) {
      this.closeMobileMenu();
    }
  }

  // ————— Shared —————
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isBrowser) {
      try {
        localStorage.setItem('darkMode', this.isDarkMode.toString());
        document.documentElement.classList.toggle('dark', this.isDarkMode);
      } catch (error) {
        console.error('Error setting dark mode preference:', error);
        // Still toggle the class even if localStorage fails
        document.documentElement.classList.toggle('dark', this.isDarkMode);
      }
    }
  }

  signOut() {
    if (this.isBrowser) {
      try {
        localStorage.removeItem('mamaToken');
        localStorage.removeItem('mamaUser');
        localStorage.removeItem('hasGreeted');
      } catch (error) {
        console.error('Error clearing auth data:', error);
      }
    }
    this.router.navigate(['/login']);
    this.closeMobileMenu();
  }

  toggleLanguage() {
    const newLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.languageService.setLanguage(newLang);
  }
}
