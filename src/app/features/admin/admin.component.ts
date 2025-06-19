import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

import { IProduct } from '../../models/Iproduct';
import { Order, UserService, User } from '../../core/services/user/userservice.service';
import { ProductService } from '../../core/services/product/product.service';
import { CategoryService } from '../../core/services/category/category.service';
import { ICategory } from '../../models/category';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, AfterViewInit {
  public environment = environment;

  isLoading = true;
  pendingItems: IProduct[] = [];
  approvedItems: IProduct[] = [];
  totalUsers = 0;
  orders: Order[] = [];
  users: User[] = [];
  isDarkMode = false;
  activeSection: 'stats' | 'orders' | 'pending' | 'approved' | 'create' | 'users' = 'stats';

  // Product creation form
  productForm!: FormGroup;
  categories: ICategory[] = [];
  previewImages: { file: File, preview: string | ArrayBuffer | null }[] = [];
  selectedFiles: File[] = [];
  isSubmitting: boolean = false;
  maxImages: number = 5;

  constructor(
    private productService: ProductService,
    private userService: UserService,
    private categoryService: CategoryService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('mamaUser') || '{}');
    if (!user || user.role !== 'admin') {
      alert('Access denied. Admins only.');
      this.router.navigate(['/']);
      return;
    }

    // Check if dark mode is active
    this.isDarkMode = document.documentElement.classList.contains('dark');

    // Setup product creation form
    this.initProductForm();

    // Fetch categories for the product form
    this.categoryService.fetchCategories().subscribe(categories => {
      this.categories = categories;
    });

    this.fetchPendingProducts();
    this.fetchAllApprovedProducts();
    this.fetchTotalUsers();
    this.loadAllOrders();
    this.loadAllUsers();
  }

  initProductForm(): void {
    const user = JSON.parse(localStorage.getItem('mamaUser') || '{}');
    this.productForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      price: new FormControl('', [Validators.required, Validators.min(0)]),
      description: new FormControl('', [Validators.required]),
      type: new FormControl('sale'),
      condition: new FormControl('New'),
      seller_id: new FormControl(user?.id, Validators.required),
      category_id: new FormControl('', [Validators.required]),
      image: new FormControl(null, Validators.required),
      status: new FormControl('approved') // Auto-approve admin products
    });
  }

  ngAfterViewInit(): void {
    // Refresh AOS
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        // AOS.refresh();
      }
    }, 100);
  }

  setActiveSection(section: 'stats' | 'orders' | 'pending' | 'approved' | 'create' | 'users'): void {
    this.activeSection = section;

    // Refresh AOS when changing sections
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        // AOS.refresh();
      }
    }, 100);
  }

  private loadAllOrders(): void {
    this.userService.getAllOrders().subscribe({
      next: (orders: Order[]) => {
        this.orders = orders;
        console.log('Loaded orders:', orders); // For debugging
        this.isLoading = false;

        // Refresh AOS after loading data
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            // AOS.refresh();
          }
        }, 100);
      },
      error: err => {
        console.error('Failed to load orders', err);
        this.isLoading = false;
      }
    });
  }

  fetchTotalUsers(): void {
    this.userService.getUserCount().subscribe({
      next: res => this.totalUsers = res.total,
      error: err => console.error('Failed to load user count', err)
    });
  }

  fetchPendingProducts(): void {
    this.productService.getPendingProducts().subscribe({
      next: (products: IProduct[]) => {
        this.pendingItems = products;

        // Refresh AOS after loading data
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            // AOS.refresh();
          }
        }, 100);
      }
    });
  }

  fetchAllApprovedProducts(): void {
    this.productService.getAll().subscribe(products => {
      this.approvedItems = products.filter(p => p.status === 'approved');

      // Refresh AOS after loading data
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // AOS.refresh();
        }
      }, 100);
    });
  }

  approveItem(item: IProduct, index: number): void {
    this.isLoading = true;
    this.productService.approveProduct(item.id).subscribe({
      next: (updatedProduct: IProduct) => {
        this.pendingItems.splice(index, 1);
        this.approvedItems.push(updatedProduct);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to approve product', err);
        alert('Failed to approve product. Please try again.');
        this.isLoading = false;
      }
    });
  }

  rejectItem(item: IProduct, index: number): void {
    this.isLoading = true;
    this.productService.rejectProduct(item.id).subscribe({
      next: () => {
        this.pendingItems.splice(index, 1);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to reject product', err);
        alert('Failed to reject product. Please try again.');
        this.isLoading = false;
      }
    });
  }

  deleteProduct(id: number, index: number): void {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.isLoading = true;
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.approvedItems.splice(index, 1);
        this.isLoading = false;
      },
      error: err => {
        console.error('Delete failed', err);
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved') return 'approved';
    if (statusLower === 'pending') return 'pending';
    if (statusLower === 'rejected') return 'rejected';
    if (statusLower === 'delivered') return 'delivered';
    if (statusLower === 'processing' || statusLower === 'shipped') return 'processing';
    if (statusLower === 'cancelled') return 'cancelled';
    return '';
  }

  // Add a helper function to get all images for a product
  getProductImages(item: IProduct): string[] {
    if (!item.images) return [item.image];
    return item.images.map(img => img.url);
  }

  // Helper function to check if a value is NaN for template use
  isNaN(val: any): boolean {
    return isNaN(val);
  }

  // Add a helper function to get primary image
  getPrimaryImage(item: IProduct): string {
    if (!item.images || item.images.length === 0) {
      // If no images array or empty, try to use the image property
      if (item.image) {
        // Handle direct image URL
        return item.image.startsWith('http')
          ? item.image
          : `${environment.apiUrl.replace('/api', '')}/${item.image}`;
      }
      // Fallback to a placeholder
      return 'assets/images/placeholder.jpg';
    }

    // Find primary image from images array
    const primary = item.images.find(img => img.is_primary);
    if (primary) {
      return primary.url.startsWith('http')
        ? primary.url
        : `${environment.apiUrl.replace('/api', '')}/${primary.url}`;
    }

    // Use first image if no primary is set
    return item.images[0].url.startsWith('http')
      ? item.images[0].url
      : `${environment.apiUrl.replace('/api', '')}/${item.images[0].url}`;
  }

  // Product creation methods (similar to SellComponent)
  get availableCategories(): ICategory[] {
    const t = this.productForm.get('type')?.value;
    return this.categories.filter(c =>
      t === 'rent'
        ? c.category_name === 'Strollers & Gear'
        : c.category_name !== 'Strollers & Gear'
    );
  }

  triggerFileInput(): void {
    if (this.previewImages.length >= this.maxImages) {
      alert(`Maximum ${this.maxImages} images allowed`);
      return;
    }
    const fileInput = document.getElementById('adminFileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  async onFileChange(evt: Event): Promise<void> {
    const input = evt.target as HTMLInputElement;
    if (!input.files?.length) return;

    // Check if adding these files would exceed max
    if (this.previewImages.length + input.files.length > this.maxImages) {
      alert(`Maximum ${this.maxImages} images allowed. You can add ${this.maxImages - this.previewImages.length} more.`);
      return;
    }

    // Process each file
    Array.from(input.files).forEach(file => {
      // Add to selected files
      this.selectedFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        this.previewImages.push({
          file: file,
          preview: e.target?.result || null
        });
      };
      reader.readAsDataURL(file);
    });

    // Update the image form control to make it valid
    if (this.selectedFiles.length > 0) {
      this.productForm.get('image')!.setValue('valid');
      this.productForm.get('image')!.updateValueAndValidity();
    }

    // Reset the input
    input.value = '';
  }

  removeImage(index: number): void {
    this.previewImages.splice(index, 1);
    this.selectedFiles.splice(index, 1);

    // Update image form control validation
    if (this.selectedFiles.length === 0) {
      this.productForm.get('image')!.setValue(null);
      this.productForm.get('image')!.updateValueAndValidity();
    }
  }

  submitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      alert('Please fill in all required fields');
      return;
    }

    if (this.selectedFiles.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    this.isSubmitting = true;
    const t = this.productForm.get('type')!.value;
    this.productForm.get('condition')!.setValue(t === 'sale' ? 'New' : 'Used');

    const fd = new FormData();
    Object.keys(this.productForm.controls).forEach(k => {
      fd.append(k, this.productForm.get(k)!.value);
    });

    // Append all images with the same field name
    this.selectedFiles.forEach(file => {
      fd.append('images', file);
    });

    this.productService.createProduct(fd).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.productForm.reset();
        this.previewImages = [];
        this.selectedFiles = [];
        alert('Product created successfully!');

        // Reset the form to default values
        this.initProductForm();

        // Refresh the product listings
        this.fetchAllApprovedProducts();
      },
      error: (err) => {
        this.isSubmitting = false;
        alert('Failed to create product. Please try again.');
        console.error('Error creating product:', err);
      }
    });
  }

  loadAllUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.isLoading = false;
      },
      error: err => {
        console.error('Failed to load users', err);
        this.isLoading = false;
      }
    });
  }

  deleteUser(userId: number): void {
    console.log('Delete button clicked for user:', userId);
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    this.isLoading = true;
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter(user => user.id !== userId);
        this.totalUsers--;
        this.isLoading = false;
      },
      error: err => {
        console.error('Failed to delete user', err);
        alert('Failed to delete user. Please try again.');
        this.isLoading = false;
      }
    });
  }

  public testClick(): void {
    console.log('Test button works');
  }
}
