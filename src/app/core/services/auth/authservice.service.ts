import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiBaseService } from '../api-base.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private apiBaseService: ApiBaseService
  ) {
    this.apiUrl = this.apiBaseService.getApiUrl('/auth');
    console.log('Auth Service initialized with API URL:', this.apiUrl);
  }



  login(data: { email: string, password: string }): Observable<any> {
    console.log('Attempting login with endpoint:', `${this.apiUrl}/login`);
    console.log('Login data:', { email: data.email, passwordLength: data.password?.length });

    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap(response => console.log('Login response received:', response)),
      catchError(error => {
        console.error('Login request failed:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        throw error;
      })
    );
  }

  signup(data: { name: string, email: string, password: string, role: string }): Observable<any> {
    console.log('Signing up user with endpoint:', `${this.apiUrl}/signup`);
    return this.http.post(`${this.apiUrl}/signup`, data);
  }


  logout(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('mamaToken');
      localStorage.removeItem('mamaUser');
    }
  }

  getUser(): any {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const userData = localStorage.getItem('mamaUser');
        return userData ? JSON.parse(userData) : {};
      } catch (e) {
        console.error('Error parsing user data:', e);
        return {};
      }
    }
    return {}; // SSR-safe fallback
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('mamaToken');
    }
    return null; // SSR-safe fallback
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}