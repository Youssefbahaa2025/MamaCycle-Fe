// src/app/shared/components/alert/alert.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent {
  message$;

  constructor(private notify: NotificationService) {
    this.message$ = this.notify.message$;
  }
}