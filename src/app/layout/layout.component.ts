import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ChatbotComponent } from '../features/chatbot/chatbot.component';
import { NavbarComponent } from '../features/navbar/navbar.component';
import { NotificationService } from '../core/services/notification.service';
import { FooterComponent } from "../features/footer/footer.component";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatbotComponent, NavbarComponent, FooterComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  isDarkMode = false;
  message: { text: string; type: 'success' | 'error' | null } | null = null;

  constructor(
    private router: Router,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      // Check for dark mode preference
      let darkModePreference = false;

      if (typeof localStorage !== 'undefined') {
        try {
          const storedPreference = localStorage.getItem('darkMode');
          if (storedPreference !== null) {
            darkModePreference = storedPreference === 'true';
          } else {
            // If no stored preference, use system preference
            darkModePreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
          }
        } catch (e) {
          console.error('Error accessing localStorage for dark mode:', e);
          // Fallback to system preference
          darkModePreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      }

      this.isDarkMode = darkModePreference;
      this.updateDarkMode();
    }

    // 🛠 Fix ExpressionChangedAfterItHasBeenCheckedError
    this.notify.message$.subscribe(msg => {
      this.message = msg;
      this.cdr.detectChanges(); // 🔧 Force refresh view after update
    });
  }

  private updateDarkMode() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  get isLoggedIn(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;

    try {
      return !!localStorage.getItem('mamaToken');
    } catch (e) {
      console.error('Error checking login status:', e);
      return false;
    }
  }

  get isAdmin(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;

    try {
      const userData = localStorage.getItem('mamaUser');
      if (!userData) return false;

      const user = JSON.parse(userData);
      return user?.role === 'admin';
    } catch (e) {
      console.error('Error checking admin status:', e);
      return false;
    }
  }
}
