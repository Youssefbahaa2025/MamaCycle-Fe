import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth/authservice.service';
import { TranslateModule } from '@ngx-translate/core';

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
  apiConnected: boolean = false;

  constructor(private authService: AuthService, private router: Router) {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required)
    });

    console.log('Login component initialized');
  }

  ngOnInit(): void {
    // Test API connection
    this.testApiConnection();
  }

  testApiConnection(): void {
    this.authService.testConnection().subscribe({
      next: (connected) => {
        this.apiConnected = connected;
        console.log('API connection status:', connected ? 'Connected' : 'Failed');

        if (!connected) {
          this.loginError = 'Unable to connect to the server. Please try again later.';
        }
      },
      error: (err) => {
        console.error('API connection test error:', err);
        this.apiConnected = false;
        this.loginError = 'Server connection error. Please try again later.';
      }
    });
  }

  login(): void {
    this.loginError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // If API is not connected, don't attempt login
    if (!this.apiConnected) {
      this.loginError = 'Cannot log in - server connection is unavailable';
      return;
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
