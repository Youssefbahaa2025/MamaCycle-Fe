// src/app/features/orders/order-success.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order/order.service';
import { CartService } from '../../core/services/cart/cartservice.service';
import { DatePipe } from '@angular/common';
import * as AOS from 'aos';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.css'],
  providers: [DatePipe]
})
export class OrderSuccessComponent implements OnInit {
  orderId: string = '';
  orderDetails: any = null;
  loading: boolean = true;
  error: string = '';
  userId: number = 0;
  orderDate: string = '';
  shippingAddress: string = '';
  paymentMethod: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private cartService: CartService,
    private datePipe: DatePipe
  ) {
    const user = localStorage.getItem('mamaUser');
    this.userId = user ? JSON.parse(user).id : 0;
    this.orderDate = this.datePipe.transform(new Date(), 'medium') || '';
  }

  ngOnInit(): void {
    // Initialize AOS animation library
    if (typeof window !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });
    }

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.orderId = params['id'];
        this.fetchOrderDetails(this.orderId);
      } else {
        this.error = 'Order ID not found.';
        this.loading = false;
      }
    });

    // If user is logged in and we have an order ID, try to get order details
    if (this.userId && this.orderId) {
      // Refresh cart to show zero items
      this.cartService.refreshCartCount(this.userId);
    }

    // If no order ID or user not logged in, redirect to home
    if (!this.orderId) {
      this.router.navigate(['/']);
    }

    this.loading = false;
  }

  fetchOrderDetails(orderId: string): void {
    // Simulate API call to fetch order details
    setTimeout(() => {
      try {
        // In a real implementation, this would be an API call
        this.orderDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Mock data for demonstration
        this.shippingAddress = 'As provided during checkout';
        this.paymentMethod = 'As selected during checkout';

        this.loading = false;
      } catch (err) {
        this.error = 'Failed to load order details.';
        this.loading = false;
      }
    }, 1000); // Simulate network delay
  }

  // Generate random colors for confetti animation
  getRandomColor(): string {
    const colors = [
      '#4ade80', // green-400
      '#6366f1', // indigo-500
      '#ec4899', // pink-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6', // violet-500
      '#06b6d4'  // cyan-500
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
