// src/app/features/rent/rent/rent.component.ts
import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import * as AOS from 'aos';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { IProduct } from '../../../models/Iproduct';
import { ProductService } from '../../../core/services/product/product.service';
import { CartService } from '../../../core/services/cart/cartservice.service';
import { WishlistService } from '../../../core/services/wishlist/wishlist.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-rent',
  standalone: true,
  templateUrl: './rent.component.html',
  styleUrls: ['./rent.component.css'],
  imports: [CommonModule, TitleCasePipe, TranslateModule]
})
export class RentComponent implements OnInit, AfterViewInit {
  public environment = environment; // expose environment for template
  products: IProduct[] = [];
  userId = 0;
  isLoading = true;
  isDarkMode = false;

  // Wishlist state
  wishlistItems: Set<number> = new Set();

  // Track current image for each product
  productImageIndex: { [key: number]: number } = {};

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router,
    private renderer: Renderer2,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    // Initialize translations
    this.translate.setDefaultLang('en');
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    this.translate.use(savedLang);

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

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const user = localStorage.getItem('mamaUser');
        this.userId = user ? JSON.parse(user).id : 0;

        // Load wishlist items if user is logged in
        if (this.userId) {
          this.loadWishlistItems();
        }
      } catch (e) {
        console.error('Error getting user from localStorage:', e);
        this.userId = 0;
      }
    }

    this.productService.refresh$.subscribe(() => this.loadProducts());
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    // Refresh AOS animations after view is initialized
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        AOS.refresh();
      }
    }, 500);
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products.filter(p => p.status === 'approved' && p.type === 'rent');

        // Initialize image indexes for all products
        this.products.forEach(product => {
          this.productImageIndex[product.id] = 0;
        });

        this.isLoading = false;

        // Refresh AOS to detect new elements
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            AOS.refresh();
          }
        }, 100);
      },
      error: (err) => {
        console.error('Error loading rental products:', err);
        this.isLoading = false;
      }
    });
  }

  addToCart(productId: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation(); // Prevent navigation to product details
    }

    this.cartService
      .addToCart({ userId: this.userId, productId, quantity: 1 })
      .subscribe({
        next: () => {
          this.cartService.refreshCartCount(this.userId);
          console.log('Product added to cart');

          // Show feedback (could be enhanced with a notification service)
          const button = document.querySelector(`button[data-product-id="${productId}"]`);
          if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = 'Added to Cart!';
            button.classList.add('bg-green-600');

            setTimeout(() => {
              button.innerHTML = originalText;
              button.classList.remove('bg-green-600');
            }, 2000);
          }
        },
        error: (err) => {
          console.error('Error adding product to cart:', err);
        }
      });
  }

  goToProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  // Load user's wishlist items
  loadWishlistItems(): void {
    this.wishlistService.loadWishlist().subscribe({
      next: (items) => {
        // Store product IDs in a Set for easy lookup
        this.wishlistItems = new Set(items.map(item => item.id));
      },
      error: (err) => {
        console.error('Error loading wishlist items:', err);
      }
    });
  }

  // Check if a product is in the wishlist
  isInWishlist(productId: number): boolean {
    return this.wishlistItems.has(productId);
  }

  // Toggle wishlist status for a product
  toggleWishlist(productId: number, event: MouseEvent): void {
    event.stopPropagation(); // Prevent navigation to product details

    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isInWishlist(productId)) {
      // Remove from wishlist
      this.wishlistService.removeFromWishlist(productId).subscribe({
        next: () => {
          this.wishlistItems.delete(productId);
        },
        error: (err) => {
          console.error('Error removing from wishlist:', err);
        }
      });
    } else {
      // Add to wishlist
      this.wishlistService.addToWishlist(productId).subscribe({
        next: () => {
          this.wishlistItems.add(productId);
        },
        error: (err) => {
          console.error('Error adding to wishlist:', err);
        }
      });
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