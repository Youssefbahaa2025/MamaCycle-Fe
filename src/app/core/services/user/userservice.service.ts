import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ICartItem } from '../../../models/icart-item';

export interface Order {
  id: number;
  user_id: number;
  user_name: string;
  total_price: number;
  payment_method: 'cod' | 'card' | 'upi';
  address: string;
  phone: string;
  status: 'pending' | 'completed' | 'canceled';
  created_at: string;
  items: ICartItem[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  phone?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';
  private orderApiUrl = '/api/orders';

  constructor(private http: HttpClient) { }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateUserProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  updateProfileImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.put(`${this.apiUrl}/profile/image`, formData);
  }

  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.orderApiUrl}/user`);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.orderApiUrl}/${id}`);
  }

  placeOrder(orderData: any): Observable<Order> {
    return this.http.post<Order>(`${this.orderApiUrl}`, orderData);
  }

  cancelOrder(id: number): Observable<any> {
    return this.http.put(`${this.orderApiUrl}/${id}/cancel`, {});
  }

  // Admin methods
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  getUserCount(): Observable<number> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/count`)
      .pipe(map(res => res.total));
  }

  getAdminOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/admin/orders`);
  }

  updateOrderStatus(id: number, status: 'pending' | 'completed' | 'canceled'): Observable<Order> {
    return this.http.put<Order>(`${this.orderApiUrl}/${id}/status`, { status });
  }

  /** Fetch a single user profile */
  getProfile(userId: number): Observable<{ user: any }> {
    return this.http.get<{ user: any }>(`${this.apiUrl}/${userId}`);
  }

  /** Upload user profile data */
  updateProfile(userId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}`, data).pipe(
      catchError((error: any) => {
        console.error('Error updating profile:', error);
        return throwError(() => new Error('Failed to update profile'));
      })
    );
  }

  /** Upload a profile picture */
  uploadProfilePicture(userId: number, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post(`${this.apiUrl}/${userId}/upload`, formData);
  }

  /** Get all users */
  getAllUsers(): Observable<User[]> {
    return this.http.get<{ users: User[] }>(`${this.apiUrl}/admin/users`).pipe(
      map(res => res.users)
    );
  }

  /** Delete a user */
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`);
  }
}
