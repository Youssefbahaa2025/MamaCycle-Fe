// src/app/app-routing.module.ts
import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },

            // 🔓 Public Pages
            {
                path: 'login',
                loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'signup',
                loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
            },

            // 🌐 Pages for all users
            {
                path: 'home',
                loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'shop',
                loadComponent: () => import('./features/shop/shop/shop.component').then(m => m.ShopComponent)
            },
            {
                path: 'rent',
                loadComponent: () => import('./features/rent/rent/rent.component').then(m => m.RentComponent)
            },
            {
                path: 'sell',
                loadComponent: () => import('./features/sell/sell.component').then(m => m.SellComponent)
            },
            {
                path: 'about',
                loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
            },
            {
                path: 'community',
                loadComponent: () => import('./features/community/community.component').then(m => m.CommunityComponent)
            },
            {
                path: 'product/:id',
                loadComponent: () => import('./features/shop/product-details/product-details.component').then(m => m.ProductDetailsComponent)
            },

            // 🔐 Protected Pages
            {
                path: 'profile',
                canActivate: [authGuard],
                loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
            },
            {
                path: 'cart',
                canActivate: [authGuard],
                loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
            },
            {
                path: 'wishlist',
                canActivate: [authGuard],
                loadComponent: () => import('./features/wishlist/wishlist.component').then(m => m.WishlistComponent)
            },
            {
                path: 'checkout',
                canActivate: [authGuard],
                loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
            }
            ,
            {
                path: 'order-success/:id',
                loadComponent: () => import('./features/order-success/order-success.component').then(m => m.OrderSuccessComponent)
            },
            {
                path: 'admin',
                canActivate: [authGuard, adminGuard],
                loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
            }
        ]
    }
];