// src/app/core/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse { answer: string; }

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) { }

  send(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>('/api/chat', { message });
  }

  getSuggestions(): Observable<string[]> {
    return this.http.get<string[]>('/api/faq-list');
  }
}
