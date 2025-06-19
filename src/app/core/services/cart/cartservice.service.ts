// src/app/core/services/cart/cartservice.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initializeCartCount();
  }

  private initializeCartCount(): void {
    if (this.isBrowser && typeof localStorage !== 'undefined') {
      try {
        const user = localStorage.getItem('mamaUser');
        if (user) {
          const userData = JSON.parse(user);
          const userId = userData?.id;
          if (userId) this.refreshCartCount(userId);
        }
      } catch (e) {
        console.error('Error initializing cart count:', e);
      }
    }
  }

  getCart(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}`);
  }

  addToCart(data: { userId: number, productId: number, quantity: number }): Observable<any> {
    return this.http.post(this.apiUrl, data).pipe(
      tap(() => this.refreshCartCount(data.userId))
    );
  }

  updateQuantity(id: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { quantity });
  }

  removeFromCart(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refreshCartCount(userId))
    );
  }

  refreshCartCount(userId: number): void {
    this.getCart(userId).subscribe(items => {
      const total = items.reduce((sum, item) => sum + item.quantity, 0);
      this.cartCountSubject.next(total);
    });
  }
}