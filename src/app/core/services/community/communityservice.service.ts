// src/app/core/services/community/communityservice.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { IComment, ICommunityPost } from '../../../models/icommunity-post';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private apiUrl = `${environment.apiUrl}/community`;
  private commentUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    console.error('Community Service Error:', error);

    let errorMessage = 'An error occurred. Please try again later.';

    // Extract more specific message if available
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  getPosts(): Observable<ICommunityPost[]> {
    return this.http.get<ICommunityPost[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  createPost(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log('Creating community post with API URL:', this.apiUrl);

    return this.http.post(this.apiUrl, formData, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  updatePost(postId: number, formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log(`Updating community post ${postId} with API URL: ${this.apiUrl}/${postId}`);

    return this.http.put(`${this.apiUrl}/${postId}`, formData, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  deletePost(postId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${postId}`, { headers });
  }

  getComments(postId: number): Observable<IComment[]> {
    return this.http.get<IComment[]>(`${this.commentUrl}/${postId}`);
  }

  addComment(postId: number, message: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.commentUrl, { post_id: postId, message }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  deleteComment(commentId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.commentUrl}/${commentId}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('mamaToken');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}