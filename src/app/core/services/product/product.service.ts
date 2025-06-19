// src/app/core/services/product/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { IProduct, ProductImage } from '../../../models/Iproduct';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = '/api/products';
  private refreshTrigger = new BehaviorSubject<void>(undefined);
  refresh$ = this.refreshTrigger.asObservable();

  constructor(private http: HttpClient) { }

  createProduct(data: FormData) {
    return this.http.post(`${this.apiUrl}`, data);
  }

  getAll(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.apiUrl}`);
  }

  getById(id: number): Observable<IProduct> {
    return this.http.get<IProduct>(`${this.apiUrl}/${id}`);
  }

  getPendingProducts(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this.apiUrl}/pending`);
  }

  approveProduct(id: number): Observable<IProduct> {
    return this.http.put<IProduct>(`${this.apiUrl}/${id}/approve`, {})
      .pipe(tap(() => this.refreshTrigger.next()));
  }

  rejectProduct(id: number): Observable<IProduct> {
    return this.http.put<IProduct>(`${this.apiUrl}/${id}/reject`, {})
      .pipe(tap(() => this.refreshTrigger.next()));
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.refreshTrigger.next()));
  }

  // New methods for managing product images
  getProductImages(productId: number): Observable<ProductImage[]> {
    return this.http.get<ProductImage[]>(`${this.apiUrl}/${productId}/images`);
  }

  addProductImages(productId: number, images: File[]): Observable<ProductImage[]> {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('images', image);
    });
    return this.http.post<ProductImage[]>(`${this.apiUrl}/${productId}/images`, formData)
      .pipe(tap(() => this.refreshTrigger.next()));
  }

  setPrimaryImage(productId: number, imageId: number): Observable<ProductImage[]> {
    return this.http.put<ProductImage[]>(`${this.apiUrl}/${productId}/images/${imageId}/primary`, {})
      .pipe(tap(() => this.refreshTrigger.next()));
  }

  deleteProductImage(productId: number, imageId: number): Observable<ProductImage[]> {
    return this.http.delete<ProductImage[]>(`${this.apiUrl}/${productId}/images/${imageId}`)
      .pipe(tap(() => this.refreshTrigger.next()));
  }
}