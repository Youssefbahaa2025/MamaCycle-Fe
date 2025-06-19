// src/app/core/services/community/communityservice.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IComment, ICommunityPost } from '../../../models/icommunity-post';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private apiUrl = '/api/community';
  private commentUrl = '/api/comments';

  constructor(private http: HttpClient) { }

  // Community post methods
  getAll(): Observable<ICommunityPost[]> {
    return this.http.get<ICommunityPost[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getById(id: number): Observable<ICommunityPost> {
    return this.http.get<ICommunityPost>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createPost(data: FormData): Observable<ICommunityPost> {
    return this.http.post<ICommunityPost>(this.apiUrl, data)
      .pipe(catchError(this.handleError));
  }

  updatePost(id: number, data: FormData): Observable<ICommunityPost> {
    return this.http.put<ICommunityPost>(`${this.apiUrl}/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Comment methods
  getComments(postId: number): Observable<IComment[]> {
    return this.http.get<IComment[]>(`${this.commentUrl}/post/${postId}`)
      .pipe(catchError(this.handleError));
  }

  addComment(comment: { post_id: number, content: string }): Observable<IComment> {
    return this.http.post<IComment>(this.commentUrl, comment)
      .pipe(catchError(this.handleError));
  }

  deleteComment(id: number): Observable<any> {
    return this.http.delete(`${this.commentUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}