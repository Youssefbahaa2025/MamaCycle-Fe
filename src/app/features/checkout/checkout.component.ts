// src/app/features/orders/checkout.component.ts
import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../core/services/order/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cartservice.service';
import * as AOS from 'aos';

interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, AfterViewInit {
  userId = 0;
  paymentMethod = 'cod';
  address = '';
  phone = '';
  errorMessage = '';
  cartItems: CartItem[] = [];
  isDarkMode = false;
  isLoading = true;

  constructor(
    private orderService: OrderService,
    private router: Router,
    private cartService: CartService,
    private renderer: Renderer2
  ) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const user = localStorage.getItem('mamaUser');
        if (user) {
          const userData = JSON.parse(user);
          this.userId = userData?.id || 0;
        }
      } catch (e) {
        console.error('Error getting user data in checkout component:', e);
      }
    }
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

      // Check if dark mode is active
      this.isDarkMode = document.documentElement.classList.contains('dark');

      // Listen for dark mode changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            this.isDarkMode = document.documentElement.classList.contains('dark');
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
    }

    this.loadCart();
  }

  ngAfterViewInit(): void {
    // Refresh AOS
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        AOS.refresh();
      }
    }, 100);
  }

  loadCart(): void {
    this.isLoading = true;
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.cartService.getCart(this.userId).subscribe(data => {
      this.cartItems = data.map(item => ({
        id: item.id,
        name: item.name,
        image: item.image.startsWith('http') ? item.image : `http://localhost:3000/${item.image}`,
        price: Number(item.price),
        quantity: item.quantity
      }));
      this.isLoading = false;

      // Refresh AOS to detect new elements
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          AOS.refresh();
        }
      }, 100);
    });
  }

  get subtotal(): number {
    return this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  placeOrder(): void {
    if (!this.address || !this.phone) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (this.cartItems.length === 0) {
      this.errorMessage = 'Your cart is empty.';
      return;
    }

    this.orderService.checkout(this.userId, this.paymentMethod, this.address, this.phone).subscribe({
      next: res => this.router.navigate(['/order-success', res.orderId]),
      error: err => {
        this.errorMessage = err.error?.message || 'Order failed. Please try again.';
      }
    });
  }
}
