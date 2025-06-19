// src/app/core/services/wishlist/wishlist.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IProduct } from '../../../models/Iproduct';

export interface WishlistNotification {
  notification_id: number;
  type: 'price_drop' | 'back_in_stock';
  is_read: boolean;
  created_at: string;
  product_id: number;
  product_name: string;
  price: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = '/api/wishlist';
  private wishlistItems = new BehaviorSubject<IProduct[]>([]);
  public wishlist$ = this.wishlistItems.asObservable();
  private wishlistCount = new BehaviorSubject<number>(0);
  public wishlistCount$ = this.wishlistCount.asObservable();
  private notifications = new BehaviorSubject<WishlistNotification[]>([]);
  public notifications$ = this.notifications.asObservable();

  constructor(private http: HttpClient) {
    this.loadWishlist();
  }

  private loadWishlist() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('mamaToken')) {
      this.getWishlist().subscribe({
        next: (items) => {
          this.wishlistItems.next(items);
          this.wishlistCount.next(items.length);
        },
        error: (err) => console.error('Error loading wishlist:', err)
      });
    }
  }

  getWishlist(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(this.apiUrl);
  }

  addToWishlist(productId: number): Observable<any> {
    return this.http.post(this.apiUrl, { product_id: productId })
      .pipe(
        tap(() => this.loadWishlist()),
        catchError(error => {
          console.error('Error adding to wishlist:', error);
          return of({ error: true, message: error.message });
        })
      );
  }

  removeFromWishlist(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${productId}`)
      .pipe(
        tap(() => this.loadWishlist()),
        catchError(error => {
          console.error('Error removing from wishlist:', error);
          return of({ error: true, message: error.message });
        })
      );
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistItems.value.some(item => item.id === productId);
  }

  getNotifications(): Observable<WishlistNotification[]> {
    return this.http.get<WishlistNotification[]>(`${this.apiUrl}/notifications`)
      .pipe(
        tap(notifications => this.notifications.next(notifications)),
        catchError(error => {
          console.error('Error getting notifications:', error);
          return of([]);
        })
      );
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${id}/read`, {});
  }
}
