// src/app/core/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatResponse { answer: string; }

@Injectable({ providedIn: 'root' })
export class ChatService {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  send(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.API_URL}/chat`, { message });
  }

  getSuggestions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/faq-list`);
  }
}
