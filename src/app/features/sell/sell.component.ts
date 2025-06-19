// src/app/features/sell/sell.component.ts
import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProductService } from '../../core/services/product/product.service';
import { CategoryService } from '../../core/services/category/category.service';
import { AuthService } from '../../core/services/auth/authservice.service';
import { NotificationService } from '../../core/services/notification.service';
import { ICategory } from '../../models/category';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-sell',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './sell.component.html',
  styleUrls: ['./sell.component.css']
})
export class SellComponent implements OnInit {
  form!: FormGroup;
  categories: ICategory[] = [];
  previewImages: { file: File, preview: string | ArrayBuffer | null }[] = [];
  selectedFiles: File[] = [];
  isSubmitting: boolean = false;
  maxImages: number = 5;
  currentLang: string = 'en';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private notify: NotificationService,
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

    const user = this.authService.getUser();

    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      price: new FormControl('', [Validators.required, Validators.min(0)]),
      description: new FormControl('', [Validators.required]),
      type: new FormControl('sale'),
      condition: new FormControl(''), // Condition will be set based on type
      seller_id: new FormControl(user?.id, Validators.required),
      category_id: new FormControl('', [Validators.required]),
      image: new FormControl(null, Validators.required)
    });

    // Set initial condition based on product type
    this.updateConditionBasedOnType('sale');

    // Listen for changes to the type field
    this.form.get('type')?.valueChanges.subscribe(type => {
      this.updateConditionBasedOnType(type);
    });

    this.categoryService.fetchCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  get availableCategories(): ICategory[] {
    const t = this.form.get('type')!.value;
    return this.categories.filter(c =>
      t === 'rent'
        ? c.category_name === 'Strollers & Gear'
        : c.category_name !== 'Strollers & Gear'
    );
  }

  getUserId(): number {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('mamaUser');
      return user ? JSON.parse(user).id : 0;
    }
    return 0;
  }

  triggerFileInput(): void {
    if (this.previewImages.length >= this.maxImages) {
      this.notify.show(`Maximum ${this.maxImages} images allowed`, 'error');
      return;
    }
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  async onFileChange(evt: Event): Promise<void> {
    const input = evt.target as HTMLInputElement;
    if (!input.files?.length) return;

    // Check if adding these files would exceed max
    if (this.previewImages.length + input.files.length > this.maxImages) {
      this.notify.show(`Maximum ${this.maxImages} images allowed. You can add ${this.maxImages - this.previewImages.length} more.`, 'error');
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
      this.form.get('image')!.setValue('valid');
      this.form.get('image')!.updateValueAndValidity();
    }

    // Reset the input
    input.value = '';
  }

  removeImage(index: number): void {
    this.previewImages.splice(index, 1);
    this.selectedFiles.splice(index, 1);

    // Update image form control validation
    if (this.selectedFiles.length === 0) {
      this.form.get('image')!.setValue(null);
      this.form.get('image')!.updateValueAndValidity();
    }
  }

  // Update condition field based on product type
  updateConditionBasedOnType(type: string): void {
    const conditionControl = this.form.get('condition');
    if (type === 'sale') {
      // For sale products, set condition to empty (not used/displayed)
      conditionControl?.setValue('');
      conditionControl?.clearValidators();
    } else {
      // For rent products, set condition to 'Like New' by default and make it required
      conditionControl?.setValue('Like New');
      conditionControl?.setValidators([Validators.required]);
    }
    conditionControl?.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.show('Please fill in all required fields', 'error');
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.notify.show('Please upload at least one image', 'error');
      return;
    }

    this.isSubmitting = true;

    // No need to set condition here as it's already handled by updateConditionBasedOnType

    const fd = new FormData();
    Object.keys(this.form.controls).forEach(k => {
      fd.append(k, this.form.get(k)!.value);
    });

    // Append all images with the same field name
    this.selectedFiles.forEach(file => {
      fd.append('images', file);
    });

    this.productService.createProduct(fd).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.form.reset();
        this.previewImages = [];
        this.selectedFiles = [];
        this.notify.show('Product submitted successfully! It will be reviewed by our team.', 'success');

        // Reset the form to default values
        this.form.patchValue({
          type: 'sale'
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notify.show('Failed to submit product. Please try again.', 'error');
        console.error('Error submitting product:', err);
      }
    });
  }
}
