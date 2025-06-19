import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user/userservice.service';
import { NotificationService } from '../../core/services/notification.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IProduct } from '../../models/Iproduct';
import { ProductService } from '../../core/services/product/product.service';
import { CartService } from '../../core/services/cart/cartservice.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import * as AOS from 'aos';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  username: string = '';
  featuredProducts: IProduct[] = [];
  userId: number = 0;
  public environment = environment;
  isLoading = true;

  // Track current image for each product
  productImageIndex: { [key: number]: number } = {};

  constructor(
    private userService: UserService,
    private notify: NotificationService,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit() {
    // Initialize AOS animation library
    if (typeof window !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });
    }

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {  // Ensure code only runs in the browser
      try {
        const userDataStr = localStorage.getItem('mamaUser');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const userId = userData.id;
          this.userId = userId || 0;

          if (userId) {
            // Check if user has been greeted before
            const hasGreeted = localStorage.getItem('hasGreeted');

            if (!hasGreeted) {  // If the user has not been greeted before
              this.userService.getProfile(userId).subscribe(
                (userData) => {
                  this.username = userData.user.name; // Ensure the user object contains the 'name' field
                  this.notify.show(`Hello ${this.username}!`, 'success'); // Show the greeting notification

                  // Set the 'hasGreeted' flag in localStorage to true
                  try {
                    localStorage.setItem('hasGreeted', 'true');
                  } catch (e) {
                    console.error('Error setting greeting flag:', e);
                  }
                },
                (error) => {
                  console.error('Error fetching user profile:', error);
                  this.notify.show('Failed to fetch user profile', 'error'); // Error notification
                }
              );
            }
          }
        }
      } catch (e) {
        console.error('Error processing user data in home component:', e);
      }
    } else {
      this.notify.show('User not logged in', 'error'); // Handle case where user is not logged in
    }

    // Load featured products
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts() {
    this.productService.getAll().subscribe(products => {
      // Get only approved products and limit to 4 for featured section
      this.featuredProducts = products
        .filter(p => p.status === 'approved')
        .slice(0, 4);

      // Initialize image indexes for all products
      this.featuredProducts.forEach(product => {
        this.productImageIndex[product.id] = 0;
      });

      this.isLoading = false;
    });
  }

  goToProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  addToCart(productId: number, event: MouseEvent): void {
    event.stopPropagation(); // Prevent navigation to product details

    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.cartService.addToCart({ userId: this.userId, productId, quantity: 1 }).subscribe({
      next: () => {
        console.log('Product added to cart');
        this.cartService.refreshCartCount(this.userId);
      },
      error: (err) => {
        console.error('Error adding product to cart', err);
      }
    });
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
