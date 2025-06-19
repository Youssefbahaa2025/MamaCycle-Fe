import { Component, OnInit, Renderer2, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as AOS from 'aos';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { IProduct } from '../../../models/Iproduct';
import { ICategory } from '../../../models/category';
import { ProductService } from '../../../core/services/product/product.service';
import { CategoryService } from '../../../core/services/category/category.service';
import { environment } from '../../../../environments/environment';
import { CartService } from '../../../core/services/cart/cartservice.service';
import { WishlistService } from '../../../core/services/wishlist/wishlist.service';
import { LanguageService } from '../../../core/services/language.service';

// Define sort options
export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'newest';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit, AfterViewInit {
  public environment = environment;        // expose environment
  products: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  categories: ICategory[] = [];

  // Basic filters
  selectedCategory: number | '' = '';
  selectedCategories: number[] = [];
  productType: 'sale' | 'rent' | null = null;

  // Advanced filters
  priceRange: { min: number; max: number } = { min: 0, max: 10000 };
  actualPriceRange: { min: number; max: number } = { min: 0, max: 10000 };
  selectedConditions: string[] = [];
  searchQuery: string = '';
  sortBy: SortOption = 'default';

  // UI state
  userId = 0;
  isLoading = true;
  isDarkMode = false;
  isFilterOpen = false;
  availableConditions: string[] = ['Like New', 'Good', 'Used'];

  // Wishlist state
  wishlistItems: Set<number> = new Set();

  // Track current image for each product
  productImageIndex: { [key: number]: number } = {};

  currentLang: string = 'en';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private categoryService: CategoryService,
    private wishlistService: WishlistService,
    private router: Router,
    private renderer: Renderer2,
    private translate: TranslateService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    // Initialize translations
    this.translate.setDefaultLang('en');

    if (typeof window !== 'undefined') {
      try {
        const savedLang = localStorage.getItem('preferredLanguage') || 'en';
        this.translate.use(savedLang);
        this.currentLang = savedLang;
      } catch (error) {
        console.error('Error reading language preference:', error);
        this.translate.use('en');
        this.currentLang = 'en';
      }

      // Initialize AOS animation library
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
            this.setupSelectOptions();
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });

      try {
        const user = localStorage.getItem('mamaUser');
        this.userId = user ? JSON.parse(user).id : 0;

        // Load wishlist items if user is logged in
        if (this.userId) {
          this.loadWishlistItems();
        }
      } catch (error) {
        console.error('Error getting user from localStorage:', error);
        this.userId = 0;
      }
    }

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      if (typeof window !== 'undefined') {
        try {
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        } catch (error) {
          console.error('Error updating document direction:', error);
        }
      }
    });

    this.categoryService.fetchCategories().subscribe(list => {
      this.categories = list;
      setTimeout(() => this.setupSelectOptions(), 100);
    });

    this.productService.refresh$.subscribe(() => this.loadProducts());
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.setupSelectOptions(), 500);
  }

  setupSelectOptions(): void {
    if (typeof window === 'undefined') return;

    // Get the select element
    const selectElement = document.querySelector('select.filter-select') as HTMLSelectElement;
    if (!selectElement) return;

    // Set dark mode styles for the select element's options using a data attribute
    if (this.isDarkMode) {
      this.renderer.setAttribute(selectElement, 'data-dark-mode', 'true');
    } else {
      this.renderer.removeAttribute(selectElement, 'data-dark-mode');
    }
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll().subscribe(products => {
      this.products = products.filter(p => p.status === 'approved');
      this.filteredProducts = [...this.products];

      // Initialize image indexes for all products
      this.products.forEach(product => {
        this.productImageIndex[product.id] = 0;
      });

      // Calculate actual price range from products
      this.calculatePriceRange();

      this.applyFilter();
      this.isLoading = false;

      // Refresh AOS to detect new elements
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          AOS.refresh();
          this.setupSelectOptions();
        }
      }, 100);
    });
  }

  calculatePriceRange(): void {
    if (this.products.length === 0) return;

    let min = Number.MAX_VALUE;
    let max = 0;

    this.products.forEach(product => {
      const price = typeof product.price === 'string'
        ? parseFloat(product.price)
        : product.price;

      if (price < min) min = price;
      if (price > max) max = price;
    });

    this.actualPriceRange = { min, max };
    this.priceRange = { ...this.actualPriceRange };
  }

  setProductType(type: 'sale' | 'rent' | null): void {
    this.productType = this.productType === type ? null : type;
    this.applyFilter();
  }

  onCategoryChange(value: string): void {
    this.selectedCategory = value === '' ? '' : +value;
    this.applyFilter();
  }

  toggleCategorySelection(categoryId: number): void {
    const index = this.selectedCategories.indexOf(categoryId);
    if (index === -1) {
      this.selectedCategories.push(categoryId);
    } else {
      this.selectedCategories.splice(index, 1);
    }
    this.applyFilter();
  }

  toggleConditionSelection(condition: string): void {
    const index = this.selectedConditions.indexOf(condition);
    if (index === -1) {
      this.selectedConditions.push(condition);
    } else {
      this.selectedConditions.splice(index, 1);
    }
    this.applyFilter();
  }

  updatePriceRange(): void {
    this.applyFilter();
  }

  onSearch(): void {
    this.applyFilter();
  }

  onSortChange(): void {
    this.applyFilter();
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.selectedCategories = [];
    this.productType = null;
    this.priceRange = { ...this.actualPriceRange };
    this.selectedConditions = [];
    this.searchQuery = '';
    this.sortBy = 'default';
    this.applyFilter();
  }

  toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  applyFilter(): void {
    let filtered = [...this.products];

    // Filter by type if selected
    if (this.productType) {
      filtered = filtered.filter(p => p.type === this.productType);
    }

    // Filter by single category if selected (legacy support)
    if (this.selectedCategory !== '' && this.selectedCategory !== null) {
      filtered = filtered.filter(p => p.category_id === this.selectedCategory);
    }

    // Filter by multiple categories if any selected
    if (this.selectedCategories.length > 0) {
      filtered = filtered.filter(p => p.category_id && this.selectedCategories.includes(p.category_id));
    }

    // Filter by price range
    filtered = filtered.filter(p => {
      const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      return price >= this.priceRange.min && price <= this.priceRange.max;
    });

    // Filter by condition
    if (this.selectedConditions.length > 0) {
      filtered = filtered.filter(p => p.condition && this.selectedConditions.includes(p.condition));
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category_name && p.category_name.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (this.sortBy !== 'default') {
      filtered = this.sortProducts(filtered, this.sortBy);
    }

    this.filteredProducts = filtered;

    // Refresh AOS to detect new elements after filtering
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        AOS.refresh();
      }
    }, 100);
  }

  sortProducts(products: IProduct[], sortOption: SortOption): IProduct[] {
    const sorted = [...products];

    switch (sortOption) {
      case 'price_asc':
        return sorted.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
          const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
          return priceA - priceB;
        });

      case 'price_desc':
        return sorted.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
          const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
          return priceB - priceA;
        });

      case 'newest':
        return sorted.sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      default:
        return sorted;
    }
  }

  addToCart(productId: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation(); // Prevent navigation to product details
    }

    this.cartService
      .addToCart({ userId: this.userId, productId, quantity: 1 })
      .subscribe({
        next: () => {
          console.log('Product added to cart');
          this.cartService.refreshCartCount(this.userId);
        },
        error: (err) => {
          console.error('Error adding product to cart', err);
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
