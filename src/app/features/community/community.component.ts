import { Component, OnInit, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityService } from '../../core/services/community/communityservice.service';
import { ICommunityPost, IComment } from '../../models/icommunity-post';
import { environment } from '../../../environments/environment';
import * as AOS from 'aos';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.css']
})
export class CommunityComponent implements OnInit {
  public assetUrl = environment.assetUrl;
  public defaultAvatar = `${this.assetUrl}/uploads/profiles/default.jpg`;

  posts: ICommunityPost[] = [];
  currentUser: any = {};
  isModalOpen = false;
  isEditing = false;
  editingPostId: number | null = null;
  imagePreview: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  commentError: string | null = null;
  showScrollTopButton = false;
  private isBrowser: boolean;
  currentLang: string = 'en';

  showComments: Record<number, boolean> = {};
  commentInputs: Record<number, string> = {};

  newPost = {
    title: '',
    content: '',
    image: null as File | null
  };

  constructor(
    private communityService: CommunityService,
    private translate: TranslateService,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.currentUser = JSON.parse(localStorage.getItem('mamaUser') || '{}');
    }
  }

  ngOnInit(): void {
    // Initialize translations
    this.translate.setDefaultLang('en');

    if (this.isBrowser) {
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
    }

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      if (this.isBrowser) {
        try {
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        } catch (error) {
          console.error('Error updating document direction:', error);
        }
      }
    });

    this.loadPosts();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.isBrowser) {
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      this.showScrollTopButton = scrollPosition > 300;
    }
  }

  scrollToTop() {
    if (this.isBrowser) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  loadPosts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.communityService.getPosts().subscribe({
      next: posts => {
        // map posts and build full URLs
        this.posts = posts.map(p => {
          const avatar = p.author_image
            ? (p.author_image.startsWith('http')
              ? p.author_image
              : `${this.assetUrl}/${p.author_image}`)
            : this.defaultAvatar;

          const postImg = p.image
            ? (p.image.startsWith('http')
              ? p.image
              : `${this.assetUrl}/${p.image}`)
            : null;

          return {
            ...p,
            authorAvatar: avatar,
            image: postImg,
            comments: []
          };
        });

        // initialize commentInputs and collapsed state
        this.posts.forEach(p => {
          this.commentInputs[p.id] = '';
          this.showComments[p.id] = false;
        });

        this.isLoading = false;

        // Refresh AOS animations after dynamic content loads
        setTimeout(() => {
          if (typeof window !== 'undefined' && AOS) {
            AOS.refresh();
          }
        }, 100);
      },
      error: err => {
        console.error('Error loading posts:', err);
        this.errorMessage = 'Failed to load posts. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  isAuthor(post: ICommunityPost): boolean {
    return post.author_id === this.currentUser.id;
  }

  isAdmin(): boolean {
    return this.currentUser.role === 'admin';
  }

  toggleComments(post: ICommunityPost): void {
    if (!this.showComments[post.id]) {
      this.communityService.getComments(post.id).subscribe({
        next: comments => {
          post.comments = comments.map(c => ({
            ...c,
            image: c.image
              ? (c.image.startsWith('http')
                ? c.image
                : `${this.assetUrl}/${c.image}`)
              : null
          }));
          this.showComments[post.id] = true;

          // Refresh AOS when comments are shown
          setTimeout(() => {
            if (typeof window !== 'undefined' && AOS) {
              AOS.refresh();
            }
          }, 100);
        },
        error: err => console.error(`Error loading comments for post ${post.id}:`, err)
      });
    } else {
      this.showComments[post.id] = !this.showComments[post.id];
    }
  }

  validateComment(postId: number): void {
    this.commentError = !this.commentInputs[postId].trim()
      ? 'Comment cannot be empty'
      : null;
  }

  submitComment(post: ICommunityPost): void {
    // Prevent admins from submitting comments
    if (this.isAdmin()) {
      console.warn('Admins are not allowed to post comments');
      return;
    }

    const message = this.commentInputs[post.id];
    if (!message?.trim()) {
      this.commentError = 'Comment cannot be empty';
      return;
    }
    this.commentError = null;

    this.communityService.addComment(post.id, message).subscribe({
      next: () => {
        // clear and reload comments
        this.commentInputs[post.id] = '';
        this.showComments[post.id] = false;
        this.toggleComments(post);
      },
      error: err => console.error('Error adding comment:', err)
    });
  }

  openNewPostModal(): void {
    this.resetForm();
    this.isModalOpen = true;
    this.isEditing = false;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.resetForm();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please select an image less than 5MB.');
      // Reset the input
      input.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please select a JPEG, PNG, GIF or WEBP image.');
      // Reset the input
      input.value = '';
      return;
    }

    // File is valid, set the image and create preview
    this.newPost.image = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview = reader.result as string;
    reader.readAsDataURL(file);

    console.log('Selected community post image:', {
      name: file.name,
      type: file.type,
      size: Math.round(file.size / 1024) + 'KB'
    });
  }

  submitPost(): void {
    // Validate required fields
    if (!this.newPost.title.trim()) {
      this.errorMessage = 'Title is required';
      return;
    }

    if (!this.newPost.content.trim()) {
      this.errorMessage = 'Content is required';
      return;
    }

    // Clear any previous errors
    this.errorMessage = null;

    // Create form data for submission
    const formData = new FormData();
    formData.append('title', this.newPost.title.trim());
    formData.append('content', this.newPost.content.trim());

    // Create a snippet from the content (first ~100 characters)
    const snippet = this.newPost.content.trim().slice(0, 100) +
      (this.newPost.content.length > 100 ? '...' : '');
    formData.append('snippet', snippet);

    formData.append('author_id', this.currentUser.id.toString());

    // Add image if present
    if (this.newPost.image) {
      formData.append('image', this.newPost.image);
      console.log('Adding image to form data:', this.newPost.image.name);
    }

    this.isLoading = true; // Show loading indicator

    // Determine if creating new or updating existing
    const action$ = this.isEditing && this.editingPostId != null
      ? this.communityService.updatePost(this.editingPostId, formData)
      : this.communityService.createPost(formData);

    action$.subscribe({
      next: (response) => {
        console.log('Post submitted successfully:', response);
        this.isLoading = false;
        this.loadPosts();
        this.closeModal();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error submitting post:', err);
        this.errorMessage = err.error?.message
          || err.message
          || 'Failed to submit post. Please try again.';
      }
    });
  }

  editPost(post: ICommunityPost): void {
    this.newPost = {
      title: post.title,
      content: post.content,
      image: null
    };
    this.imagePreview = post.image || null;
    this.isEditing = true;
    this.editingPostId = post.id;
    this.isModalOpen = true;
  }

  deletePost(id: number): void {
    if (!confirm('Delete this post?')) return;
    this.communityService.deletePost(id).subscribe({
      next: () => this.loadPosts(),
      error: err => console.error('Delete failed', err)
    });
  }

  deleteComment(postId: number, commentId: number): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.communityService.deleteComment(commentId).subscribe({
        next: () => {
          // Find the post and remove the comment from its comments array
          const post = this.posts.find(p => p.id === postId);
          if (post && post.comments) {
            post.comments = post.comments.filter(c => c.id !== commentId);
          }
        },
        error: err => console.error('Error deleting comment:', err)
      });
    }
  }

  private resetForm(): void {
    this.newPost = { title: '', content: '', image: null };
    this.imagePreview = null;
    this.editingPostId = null;
    this.commentError = null;
  }

  isCommentOwner(comment: IComment): boolean {
    return comment.user_id === this.currentUser.id;
  }
}
