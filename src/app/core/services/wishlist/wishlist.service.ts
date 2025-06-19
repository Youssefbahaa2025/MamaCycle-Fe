// src/app/core/services/wishlist/wishlist.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
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
  private apiUrl = `${environment.apiUrl}/wishlist`;
  
  // Observable sources
  private wishlistItemsSubject = new BehaviorSubject<IProduct[]>([]);
  private wishlistCountSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<WishlistNotification[]>([]);
  private unreadNotificationCountSubject = new BehaviorSubject<number>(0);
  
  // Observable streams
  wishlistItems$ = this.wishlistItemsSubject.asObservable();
  wishlistCount$ = this.wishlistCountSubject.asObservable();
  notifications$ = this.notificationsSubject.asObservable();
  unreadNotificationCount$ = this.unreadNotificationCountSubject.asObservable();
  
  constructor(private http: HttpClient) { }
  
  // Load user's wishlist
  loadWishlist(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.apiUrl}`).pipe(
      tap(items => {
        this.wishlistItemsSubject.next(items);
        this.wishlistCountSubject.next(items.length);
      }),
      catchError(error => {
        console.error('Error loading wishlist', error);
        return of([]);
      })
    );
  }
  
  // Add product to wishlist
  addToWishlist(productId: number): Observable<{message: string, count: number}> {
    return this.http.post<{message: string, count: number}>(`${this.apiUrl}`, { productId }).pipe(
      tap(response => {
        this.wishlistCountSubject.next(response.count);
        // Reload wishlist to get updated items
        this.loadWishlist().subscribe();
      }),
      catchError(error => {
        console.error('Error adding to wishlist', error);
        return of({ message: 'Error adding to wishlist', count: this.wishlistCountSubject.value });
      })
    );
  }
  
  // Remove product from wishlist
  removeFromWishlist(productId: number): Observable<{message: string, count: number}> {
    return this.http.delete<{message: string, count: number}>(`${this.apiUrl}/${productId}`).pipe(
      tap(response => {
        this.wishlistCountSubject.next(response.count);
        // Update local wishlist items
        const currentItems = this.wishlistItemsSubject.value;
        this.wishlistItemsSubject.next(currentItems.filter(item => item.id !== productId));
      }),
      catchError(error => {
        console.error('Error removing from wishlist', error);
        return of({ message: 'Error removing from wishlist', count: this.wishlistCountSubject.value });
      })
    );
  }
  
  // Check if product is in wishlist
  isInWishlist(productId: number): Observable<{isInWishlist: boolean}> {
    return this.http.get<{isInWishlist: boolean}>(`${this.apiUrl}/check/${productId}`).pipe(
      catchError(error => {
        console.error('Error checking wishlist', error);
        return of({ isInWishlist: false });
      })
    );
  }
  
  // Get wishlist notifications
  getNotifications(): Observable<WishlistNotification[]> {
    return this.http.get<WishlistNotification[]>(`${this.apiUrl}/notifications`).pipe(
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        const unreadCount = notifications.filter(n => !n.is_read).length;
        this.unreadNotificationCountSubject.next(unreadCount);
      }),
      catchError(error => {
        console.error('Error getting notifications', error);
        return of([]);
      })
    );
  }
  
  // Mark notification as read
  markNotificationAsRead(notificationId: number): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.apiUrl}/notifications/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Update local notifications
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => 
          n.notification_id === notificationId ? {...n, is_read: true} : n
        );
        this.notificationsSubject.next(updatedNotifications);
        
        // Update unread count
        const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
        this.unreadNotificationCountSubject.next(unreadCount);
      }),
      catchError(error => {
        console.error('Error marking notification as read', error);
        return of({ message: 'Error marking notification as read' });
      })
    );
  }
  
  // Get unread notification count
  getUnreadNotificationCount(): Observable<{count: number}> {
    return this.http.get<{count: number}>(`${this.apiUrl}/notifications/count`).pipe(
      tap(response => {
        this.unreadNotificationCountSubject.next(response.count);
      }),
      catchError(error => {
        console.error('Error getting notification count', error);
        return of({ count: 0 });
      })
    );
  }
}
