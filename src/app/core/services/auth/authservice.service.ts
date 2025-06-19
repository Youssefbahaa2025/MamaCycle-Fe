import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  login(data: { email: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  signup(data: { name: string, email: string, password: string, role: string }): Observable<any> {
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