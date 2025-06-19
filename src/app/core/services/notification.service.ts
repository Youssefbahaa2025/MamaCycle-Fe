// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messageSubject = new BehaviorSubject<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });
  public message$ = this.messageSubject.asObservable();

  show(text: string, type: 'success' | 'error') {
    this.messageSubject.next({ text, type });
    setTimeout(() => this.clear(), 3000);
  }

  clear() {
    this.messageSubject.next({ text: '', type: null });
  }
}

