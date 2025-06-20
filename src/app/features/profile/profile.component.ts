// src/app/features/profile/profile.component.ts
import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { UserService } from '../../core/services/user/userservice.service';
import { AuthService } from '../../core/services/auth/authservice.service';
import { ProductService } from '../../core/services/product/product.service';
import { OrderService } from '../../core/services/order/order.service';
import { IProduct } from '../../models/Iproduct';
import { environment } from '../../../environments/environment';
import * as AOS from 'aos';

interface Order {
  id: number;
  created_at: string;
  status: string;
  total_price: number;
  address: string;
  phone: string;
  items: Array<{
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    product_name: string;
    image?: string;
  }>;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, AfterViewInit {
  public environment = environment; // expose for template
  form: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  selectedImage: File | null = null;
  userId: number;
  myItems: IProduct[] = [];
  myOrders: Order[] = [];
  user: any;
  activeTab: 'profile' | 'listings' | 'orders' = 'profile';
  isDarkMode = false;
  isLoading = true;
  orderStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router,
    private renderer: Renderer2
  ) {
    const currentUser = this.authService.getUser();
    this.userId = currentUser?.id;

    this.form = new FormGroup({
      name: new FormControl({ value: '', disabled: true }, Validators.required),
      email: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.email])
    });
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

    // Set initial loading state
    this.isLoading = true;

    // Initialize counters for tracking loaded resources
    let loadedResources = 0;
    const totalResources = 3; // user data, products, orders

    const checkAllLoaded = () => {
      loadedResources++;
      if (loadedResources >= totalResources) {
        this.isLoading = false;
      }
    };

    // Load user profile data
    this.loadUserData().then(() => checkAllLoaded())
      .catch(() => checkAllLoaded());

    // Load user products
    this.loadUserProducts().then(() => checkAllLoaded())
      .catch(() => checkAllLoaded());

    // Load user orders
    this.loadUserOrders().then(() => checkAllLoaded())
      .catch(() => checkAllLoaded());
  }

  ngAfterViewInit(): void {
    // Refresh AOS
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        AOS.refresh();
      }
    }, 100);
  }

  loadUserData(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.userId) {
        console.error('Cannot load user data: No user ID available');
        reject(new Error('No user ID available'));
        return;
      }

      this.userService.getProfile(this.userId).subscribe({
        next: (resp: { user: any }) => {
          this.user = resp.user;
          this.form.patchValue({
            name: this.user.name,
            email: this.user.email
          });

          this.imagePreview = this.user.image
            ? (this.user.image.startsWith('http')
              ? this.user.image
              : `${this.environment.apiUrl.replace('/api', '')}/${this.user.image}`)
            : `${this.environment.apiUrl.replace('/api', '')}/uploads/profiles/default.jpg`;

          resolve();
        },
        error: (err: any) => {
          console.error('Failed to load profile data', err);
          if (err.status !== 404) {
            alert('Failed to load profile data');
          }
          reject(err);
        }
      });
    });
  }

  loadUserProducts(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.productService.getAll().subscribe({
        next: (products: IProduct[]) => {
          this.myItems = products.filter(p => p.seller_id === this.userId);

          // Refresh AOS to detect new elements
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              AOS.refresh();
            }
          }, 100);
          resolve();
        },
        error: (err: any) => {
          console.error('Failed to load user products', err);
          this.myItems = []; // Ensure empty array on error
          reject(err);
        }
      });
    });
  }

  loadUserOrders(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.userId) {
        console.error('Cannot load orders: No user ID available');
        this.myOrders = []; // Ensure empty array
        resolve();
        return;
      }

      this.orderService.getUserOrders(this.userId).subscribe({
        next: (orders: Order[]) => {
          this.myOrders = orders;

          // Refresh AOS to detect new elements
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              AOS.refresh();
            }
          }, 100);
          resolve();
        },
        error: (err: any) => {
          console.error('Failed to load user orders', err);
          this.myOrders = []; // Ensure empty array on error

          // Don't show alert for 404 (no orders yet)
          if (err.status !== 404) {
            // Silent error - handled by the loading state
          }
          reject(err);
        }
      });
    });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please select an image less than 5MB.');
      input.value = '';
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please select a JPEG, PNG, GIF or WEBP image.');
      input.value = '';
      return;
    }

    console.log(`Selected profile image: ${file.name}, size: ${Math.round(file.size / 1024)}KB, type: ${file.type}`);
    this.selectedImage = file;

    const reader = new FileReader();
    reader.onload = e => this.imagePreview = e.target?.result || null;
    reader.readAsDataURL(file);

    // Clear the input value to allow selecting the same file again if needed
    input.value = '';
  }

  uploadProfilePicture(): void {
    if (!this.selectedImage) {
      alert('Please select an image first');
      return;
    }

    console.log('Uploading profile picture:', {
      userId: this.userId,
      fileName: this.selectedImage.name,
      fileType: this.selectedImage.type,
      fileSize: Math.round(this.selectedImage.size / 1024) + 'KB'
    });

    this.isLoading = true;
    this.userService.uploadProfilePicture(this.userId, this.selectedImage).subscribe({
      next: (res: { path: string }) => {
        console.log('Profile picture uploaded successfully:', res);
        this.isLoading = false;

        const updatedUser = { ...this.user, image: res.path };
        localStorage.setItem('mamaUser', JSON.stringify(updatedUser));
        this.user = updatedUser;

        // Ensure the image URL is properly formatted - but for Cloudinary we can use the URL as-is
        this.imagePreview = res.path;

        alert('Profile picture updated!');

        // Reset the selected image
        this.selectedImage = null;
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error uploading image:', err);

        // Display a user-friendly error message
        let errorMessage = 'Failed to upload image. Please try again.';
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        }

        alert(errorMessage);
      }
    });
  }

  deleteItem(productId: number, index: number): void {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        this.myItems.splice(index, 1);
        alert('Product deleted successfully!');
      },
      error: (err: any) => {
        console.error('Error deleting product:', err);
        alert('Failed to delete product: ' + err.message);
      }
    });
  }

  setActiveTab(tab: 'profile' | 'listings' | 'orders'): void {
    this.activeTab = tab;

    // Refresh AOS when changing tabs
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        AOS.refresh();
      }
    }, 100);
  }

  navigateToOrderDetails(orderId: number): void {
    this.router.navigate(['/order-success', orderId]);
  }

  getStatusClass(status: string): string {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'approved';
      case 'processing':
      case 'shipped':
      case 'pending':
        return 'pending';
      case 'cancelled':
      case 'canceled':
        return 'rejected';
      default:
        return '';
    }
  }

  addNewProduct(): void {
    this.router.navigate(['/sell']);
  }
}