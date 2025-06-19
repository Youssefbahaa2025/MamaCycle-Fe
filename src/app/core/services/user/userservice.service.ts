import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
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

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  /** Fetch total number of users */
  getUserCount(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/count`);
  }

  /** Admin-only: fetch all orders with items */
  getAllOrders(): Observable<Order[]> {
    return this.http
      .get<{ orders: any[]; message: string }>(`${this.apiUrl}/admin/orders`)
      .pipe(
        map(res =>
          res.orders.map(o => ({
            id: o.id,
            user_id: o.user_id,
            user_name: o.user_name,
            total_price: +o.total_price,
            payment_method: o.payment_method,
            address: o.address,
            phone: o.phone,
            status: o.status,
            created_at: o.created_at,
            items: o.items.map((i: any): ICartItem => ({
              id: i.id,
              name: i.product_name,
              image: i.image,
              price: +i.price,
              quantity: i.quantity
            }))
          }))
        )
      );
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
    console.log(`Uploading profile picture for user ${userId}`, { fileName: image.name, fileSize: image.size });

    const formData = new FormData();
    formData.append('image', image);

    return this.http.post(`${this.apiUrl}/${userId}/upload`, formData).pipe(
      catchError((error: any) => {
        console.error('Error uploading profile picture:', error);
        let errorMessage = 'Failed to upload profile picture';

        // Extract more specific error if available
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
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
