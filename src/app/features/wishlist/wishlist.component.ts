// src/app/features/wishlist/wishlist.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import * as AOS from 'aos';

import { IProduct } from '../../models/Iproduct';
import { WishlistService, WishlistNotification } from '../../core/services/wishlist/wishlist.service';
import { CartService } from '../../core/services/cart/cartservice.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  public environment = environment;
  wishlistItems: IProduct[] = [];
  notifications: WishlistNotification[] = [];
  isLoading = true;
  showNotifications = false;
  unreadNotificationCount = 0;
  userId = 0;

  // Track current image for each product
  productImageIndex: { [key: number]: number } = {};

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Initialize AOS animation library
    if (typeof window !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });

      // Only access localStorage in browser environment
      if (typeof localStorage !== 'undefined') {
        try {
          const user = localStorage.getItem('mamaUser');
          this.userId = user ? JSON.parse(user).id : 0;

          // Only load wishlist and notifications if we have a user
          if (this.userId) {
            this.loadWishlist();
            this.loadNotifications();
            return; // Skip the loadWishlist calls below
          }
        } catch (e) {
          console.error('Error accessing localStorage:', e);
        }
      }
    }

    // These will only run if we're not in a browser or if there's no user
    if (this.userId) {
      this.loadWishlist();
      this.loadNotifications();
    } else {
      this.isLoading = false; // Stop loading state if no user
    }
  }

  loadWishlist(): void {
    this.isLoading = true;
    this.wishlistService.loadWishlist().subscribe(items => {
      this.wishlistItems = items;

      // Initialize image indexes for all products
      this.wishlistItems.forEach(product => {
        this.productImageIndex[product.id] = 0;
      });

      this.isLoading = false;

      // Refresh AOS to detect new elements
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          AOS.refresh();
        }
      }, 100);
    });
  }

  loadNotifications(): void {
    this.wishlistService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
      this.updateUnreadCount();
    });
  }

  removeFromWishlist(productId: number, event: Event): void {
    event.stopPropagation();
    this.wishlistService.removeFromWishlist(productId).subscribe(() => {
      // Item is already removed from the list by the service
    });
  }

  addToCart(productId: number, event: Event): void {
    event.stopPropagation();
    this.cartService
      .addToCart({ userId: this.userId, productId, quantity: 1 })
      .subscribe();
  }

  goToProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;

    // Mark notifications as read when opened
    if (this.showNotifications) {
      this.notifications.forEach(notification => {
        if (!notification.is_read) {
          this.markNotificationAsRead(notification.notification_id);
        }
      });
    }
  }

  updateUnreadCount(): void {
    this.unreadNotificationCount = this.notifications.filter(n => !n.is_read).length;
  }

  markNotificationAsRead(notificationId: number): void {
    this.wishlistService.markNotificationAsRead(notificationId).subscribe(() => {
      // Update the notification in the local array
      const index = this.notifications.findIndex(n => n.notification_id === notificationId);
      if (index !== -1) {
        this.notifications[index].is_read = true;
        this.updateUnreadCount();
      }
    });
  }

  shareWishlist(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      console.warn('Share functionality is only available in browser environment');
      return;
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share !== 'undefined') {
      // Use Web Share API if available
      navigator.share({
        title: 'My MamaCycle Wishlist',
        text: 'Check out my wishlist on MamaCycle!',
        url: window.location.href
      }).catch(error => console.log('Error sharing:', error));
    } else if (typeof navigator !== 'undefined' && typeof navigator.clipboard !== 'undefined') {
      // Fallback to clipboard copy
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        alert('Wishlist link copied to clipboard!');
      }).catch(err => {
        console.error('Could not copy text: ', err);
      });
    } else {
      console.warn('Share functionality not available on this device');
    }
  }

  // Cycle to next image on hover
  nextProductImage(product: IProduct, event: MouseEvent): void {
    if (!product.images || product.images.length <= 1) return;

    const currentIndex = this.productImageIndex[product.id] || 0;
    const nextIndex = (currentIndex + 1) % product.images.length;
    this.productImageIndex[product.id] = nextIndex;

    // Prevent event bubbling
    event.stopPropagation();
  }

  // Get current image to display for a product
  getCurrentImage(product: IProduct): string {
    if (!product.images || product.images.length === 0) return product.image;

    const currentIndex = this.productImageIndex[product.id] || 0;
    return product.images[currentIndex].url;
  }

  // Reset image index when mouse leaves
  resetProductImage(product: IProduct, event: MouseEvent): void {
    if (!product.images || product.images.length <= 1) return;

    this.productImageIndex[product.id] = 0;

    // Prevent event bubbling
    event.stopPropagation();
  }
}
