// src/app/features/cart/cart.component.ts
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cartservice.service';
import * as AOS from 'aos';
import { environment } from '../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';

interface ICartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  description?: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: ICartItem[] = [];
  userId = 0;
  private isBrowser: boolean;
  public environment = environment; // Expose environment

  constructor(
    private cartService: CartService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser && typeof localStorage !== 'undefined') {
      try {
        const user = localStorage.getItem('mamaUser');
        if (user) {
          const userData = JSON.parse(user);
          this.userId = userData?.id || 0;
        }
      } catch (e) {
        console.error('Error getting user data in cart component:', e);
      }
    }
  }

  ngOnInit(): void {
    // Initialize AOS animation library
    if (this.isBrowser) {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });

      this.loadCart();
    }
  }

  loadCart(): void {
    if (!this.userId) return;
    this.cartService.getCart(this.userId).subscribe(data => {
      this.cartItems = data.map(item => ({
        ...item,
        price: Number(item.price)
        // Don't process images here, we'll handle in the template
      }));

      // Refresh AOS animations after cart loads
      setTimeout(() => {
        if (this.isBrowser && AOS) {
          AOS.refresh();
        }
      }, 100);
    });
  }

  getImageUrl(item: ICartItem): string {
    if (!item.image) return 'assets/images/placeholder.jpg';

    return item.image.startsWith('http')
      ? item.image
      : `${this.environment.apiUrl.replace('/api', '')}/${item.image}`;
  }

  get subtotal(): number {
    return this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  increaseQuantity(item: ICartItem): void {
    this.cartService.updateQuantity(item.id, item.quantity + 1).subscribe(() => {
      this.loadCart();
      this.cartService.refreshCartCount(this.userId);
    });
  }

  decreaseQuantity(item: ICartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.id, item.quantity - 1).subscribe(() => {
        this.loadCart();
        this.cartService.refreshCartCount(this.userId);
      });
    }
  }

  removeItem(item: ICartItem): void {
    this.cartService.removeFromCart(item.id, this.userId).subscribe(() => {
      this.loadCart();
    });
  }

  deleteAll(): void {
    const itemIds = this.cartItems.map(item => item.id);
    itemIds.forEach(id => {
      this.cartService.removeFromCart(id, this.userId).subscribe(() => {
        this.loadCart();
        this.cartService.refreshCartCount(this.userId);
      });
    });
  }

  // ✅ Redirect to full checkout page
  checkout(): void {
    this.router.navigate(['/checkout']);
  }
}
