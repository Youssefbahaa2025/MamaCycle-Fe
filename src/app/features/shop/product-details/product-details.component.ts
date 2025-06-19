// src/app/features/shop/product-details/product-details.component.ts
import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as AOS from 'aos';

import { IProduct } from '../../../models/Iproduct';
import { ProductService } from '../../../core/services/product/product.service';
import { CartService } from '../../../core/services/cart/cartservice.service';
import { ReviewService } from '../../../core/services/reviews/review.service';
import { WishlistService } from '../../../core/services/wishlist/wishlist.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit, AfterViewInit {
  public environment = environment;
  product: IProduct | null = null;
  selectedImage: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  userId = 0;
  isAdmin = false;
  reviews: any[] = [];
  newReview = { rating: 5, comment: '' };
  isLoading = true;
  isDarkMode = false;
  isInWishlist = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private wishlistService: WishlistService,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      if (productId) {
        const id = parseInt(productId);
        this.loadProduct(id);
        this.loadReviews(id);
        this.checkWishlistStatus(id);
      }
    });

    // Get user from localStorage - only in browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const user = localStorage.getItem('mamaUser');
      if (user) {
        try {
          const userData = JSON.parse(user);
          this.userId = userData.id;
          this.isAdmin = userData.role === 'admin';
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }

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
  }

  ngAfterViewInit(): void {
    // Refresh AOS animations after view is initialized
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        AOS.refresh();
      }
    }, 500);
  }

  loadProduct(productId: number): void {
    this.isLoading = true;
    this.productService.getById(productId).subscribe({
      next: (product) => {
        this.product = product;

        // Set the selected image to the primary image or first image in the array
        if (product.images && product.images.length > 0) {
          const primaryImage = product.images.find(img => img.is_primary);
          this.selectedImage = primaryImage ? primaryImage.url : product.images[0].url;
        } else {
          this.selectedImage = product.image;
        }

        this.errorMessage = null;
        this.isLoading = false;
        // Refresh AOS animations
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            AOS.refresh();
          }
        }, 100);
      },
      error: (err) => {
        this.errorMessage = err.status === 404
          ? 'Product not found.'
          : 'Failed to load product details. Please try again later.';
        this.product = null;
        this.isLoading = false;
      }
    });
  }

  loadReviews(productId: number): void {
    this.reviewService.getReviewsByProduct(productId).subscribe({
      next: (res) => {
        this.reviews = res;
        // Refresh AOS animations
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            AOS.refresh();
          }
        }, 100);
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
      }
    });
  }

  addToCart(productId: number): void {
    this.successMessage = null;
    this.errorMessage = null;
    this.cartService.addToCart({ userId: this.userId, productId, quantity: 1 }).subscribe({
      next: () => {
        this.successMessage = 'Product added to cart!';
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: () => this.errorMessage = 'Failed to add product to cart.'
    });
  }

  toggleWishlist(productId: number): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.isInWishlist) {
      // Remove from wishlist
      this.wishlistService.removeFromWishlist(productId).subscribe({
        next: () => {
          this.isInWishlist = false;
          this.successMessage = 'Product removed from wishlist!';
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: () => this.errorMessage = 'Failed to remove product from wishlist.'
      });
    } else {
      // Add to wishlist
      this.wishlistService.addToWishlist(productId).subscribe({
        next: () => {
          this.isInWishlist = true;
          this.successMessage = 'Product added to wishlist!';
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: () => this.errorMessage = 'Failed to add product to wishlist.'
      });
    }
  }

  checkWishlistStatus(productId: number): void {
    if (this.userId) {
      this.wishlistService.isInWishlist(productId).subscribe({
        next: (response) => {
          this.isInWishlist = response.isInWishlist;
        },
        error: () => {
          console.error('Failed to check wishlist status');
        }
      });
    }
  }

  submitReview(): void {
    if (!this.product) return;
    if (!this.newReview.comment.trim()) {
      this.errorMessage = 'Please enter a comment for your review.';
      return;
    }

    this.reviewService.addReview({
      userId: this.userId,
      productId: this.product.id,
      ...this.newReview
    }).subscribe({
      next: () => {
        this.newReview.comment = '';
        if (this.product) {
          this.loadReviews(this.product.id);
        }
        this.successMessage = 'Your review has been submitted successfully!';
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (err) => {
        this.errorMessage = 'Failed to submit review. Please try again.';
        console.error('Error submitting review:', err);
      }
    });
  }

  deleteReview(reviewId: number) {
    if (confirm('Are you sure you want to delete this review?')) {
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          if (this.product) {
            this.loadReviews(this.product.id);
          }
          this.successMessage = 'Review deleted successfully.';
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (err) => {
          this.errorMessage = 'Failed to delete review.';
          console.error('Error deleting review:', err);
        }
      });
    }
  }

  // Image navigation methods
  nextImage(): void {
    if (!this.product || !this.product.images || this.product.images.length <= 1) return;

    const currentIndex = this.product.images.findIndex(img => img.url === this.selectedImage);
    const nextIndex = (currentIndex + 1) % this.product.images.length;
    this.selectedImage = this.product.images[nextIndex].url;
  }

  prevImage(): void {
    if (!this.product || !this.product.images || this.product.images.length <= 1) return;

    const currentIndex = this.product.images.findIndex(img => img.url === this.selectedImage);
    let prevIndex = (currentIndex - 1);
    if (prevIndex < 0) prevIndex = this.product.images.length - 1;

    this.selectedImage = this.product.images[prevIndex].url;
  }

  getCurrentImageIndex(): number {
    if (!this.product || !this.product.images || this.product.images.length <= 1) return 0;

    const currentIndex = this.product.images.findIndex(img => img.url === this.selectedImage);
    return currentIndex !== -1 ? currentIndex : 0;
  }
}