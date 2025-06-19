// src/app/core/services/cart/cartservice.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = '/api/cart';
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
    if (this.isBrowser && localStorage.getItem('mamaToken')) {
      this.getCartCount().subscribe({
        next: (count) => this.cartCountSubject.next(count),
        error: (err) => console.error('Error fetching cart count:', err)
      });
    }
  }

  getCartItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  addToCart(data: { product_id: number, quantity: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data)
      .pipe(tap(() => this.updateCartCount()));
  }

  updateCartItem(id: number, data: { quantity: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data)
      .pipe(tap(() => this.updateCartCount()));
  }

  removeFromCart(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.updateCartCount()));
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clear`)
      .pipe(tap(() => this.cartCountSubject.next(0)));
  }

  private getCartCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/count`)
      .pipe(
        tap(response => console.log('Cart count response:', response)),
        map(response => response.count),
        tap(count => this.cartCountSubject.next(count)),
        tap(() => console.log('Updated cart count:', this.cartCountSubject.value))
      );
  }

  private updateCartCount(): void {
    if (this.isBrowser && localStorage.getItem('mamaToken')) {
      this.getCartCount().subscribe();
    }
  }
}