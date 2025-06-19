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
  date: string;
  status: string;
  total: number;
  items: number;
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

    this.loadUserData();
    this.loadUserProducts();
    this.loadUserOrders();
  }

  ngAfterViewInit(): void {
    // Refresh AOS
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        AOS.refresh();
      }
    }, 100);
  }

  loadUserData(): void {
    this.isLoading = true;
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

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load profile data', err);
        alert('Failed to load profile data');
        this.isLoading = false;
      }
    });
  }

  loadUserProducts(): void {
    this.productService.getAll().subscribe({
      next: (products: IProduct[]) => {
        this.myItems = products.filter(p => p.seller_id === this.userId);

        // Refresh AOS to detect new elements
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            AOS.refresh();
          }
        }, 100);
      },
      error: (err: any) => console.error('Failed to load user products', err)
    });
  }

  loadUserOrders(): void {
    // In a real app, you would fetch real order data
    // This creates mock data for demonstration purposes
    setTimeout(() => {
      this.myOrders = Array(4).fill(0).map((_, i) => ({
        id: 10000 + i,
        date: new Date(Date.now() - i * 86400000 * 3).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        status: this.orderStatuses[Math.floor(Math.random() * this.orderStatuses.length)],
        total: Math.floor(Math.random() * 1000) + 500,
        items: Math.floor(Math.random() * 5) + 1
      }));

      // Refresh AOS
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          AOS.refresh();
        }
      }, 100);
    }, 500);
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImage = input.files[0];
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = e.target?.result || null;
      reader.readAsDataURL(this.selectedImage);
    }
  }

  uploadProfilePicture(): void {
    if (!this.selectedImage) {
      alert('Please select an image first');
      return;
    }

    this.userService.uploadProfilePicture(this.userId, this.selectedImage).subscribe({
      next: (res: { path: string }) => {
        const updatedUser = { ...this.user, image: res.path };
        localStorage.setItem('mamaUser', JSON.stringify(updatedUser));
        this.user = updatedUser;
        this.imagePreview = res.path.startsWith('http')
          ? res.path
          : `${this.environment.apiUrl.replace('/api', '')}/${res.path}`;
        alert('Profile picture updated!');
      },
      error: (err: any) => {
        console.error('Error uploading image:', err);
        alert('Failed to upload image');
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
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'approved';
      case 'processing':
      case 'shipped':
        return 'pending';
      case 'cancelled':
        return 'rejected';
      default:
        return '';
    }
  }

  addNewProduct(): void {
    this.router.navigate(['/sell']);
  }
}