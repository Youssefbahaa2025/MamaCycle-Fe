import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth/authservice.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  loginError: string = '';
  isLoading: boolean = false;
  isRetrying: boolean = false;
  apiConnected: boolean = true; // Set default to true

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required)
    });

    console.log('Login component initialized');
  }

  ngOnInit(): void {
    // Check if the API is available
    this.checkApiConnection();
  }

  // Check if the API is reachable
  checkApiConnection(): void {
    this.isRetrying = true;

    // First try the auth test endpoint
    const authTestUrl = `${environment.apiUrl}/auth/test`;
    console.log(`Checking Auth API at: ${authTestUrl}`);

    this.http.get(authTestUrl).pipe(
      catchError(err => {
        console.log('Auth test endpoint failed, trying general health endpoint');
        // If auth test fails, try the general health endpoint
        const apiHealthUrl = `${environment.apiUrl}/health`;
        return this.http.get(apiHealthUrl).pipe(
          catchError(err2 => {
            console.error('Both API health checks failed:', err2);
            this.apiConnected = false;
            this.loginError = 'Cannot log in - server connection is unavailable';
            return of(null);
          })
        );
      }),
      finalize(() => {
        // Always set isRetrying to false when done
        this.isRetrying = false;
      })
    ).subscribe({
      next: (res) => {
        if (res) {
          console.log('API connection successful:', res);
          this.apiConnected = true;
          // Clear any previous connection error
          if (this.loginError === 'Cannot log in - server connection is unavailable') {
            this.loginError = '';
          }
        }
      }
    });
  }

  login(): void {
    this.loginError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // If API is not connected, try one more check before giving up
    if (!this.apiConnected) {
      this.checkApiConnection();
      if (!this.apiConnected) {
        this.loginError = 'Cannot log in - server connection is unavailable';
        return;
      }
    }

    console.log('Attempting login with email:', this.form.value.email);
    this.isLoading = true;

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        console.log('Login successful:', res);
        this.isLoading = false;

        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('mamaToken', res.token);
            localStorage.setItem('mamaUser', JSON.stringify(res.user));
            console.log('Auth data stored successfully');
          } catch (e) {
            console.error('Error storing auth data:', e);
          }
        }

        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error:', err);

        if (err.status === 401) {
          this.loginError = 'Invalid email or password';
        } else if (err.status === 0) {
          this.loginError = 'Network error - please check your connection';
        } else if (err.status === 500) {
          this.loginError = 'Server error - please try again later';
        } else {
          this.loginError = 'Login failed - please try again';
        }
      }
    });
  }
}
