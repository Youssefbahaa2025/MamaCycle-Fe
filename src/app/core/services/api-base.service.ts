import { Injectable, isDevMode } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Base service to provide API URL management across all services
 */
@Injectable({
    providedIn: 'root'
})
export class ApiBaseService {
    private readonly _apiUrl: string;
    private readonly _assetUrl: string;
    private readonly _isProduction: boolean;

    constructor() {
        // Check if we're running in production
        this._isProduction = window.location.hostname !== 'localhost';

        // Log environment configuration for debugging
        console.log('Environment config:', environment);
        console.log('Production mode detected:', this._isProduction);

        // Determine correct API URL based on deployment
        if (this._isProduction) {
            // Use the current domain as API base to avoid CORS issues
            const baseUrl = window.location.origin;

            // For Vercel deployment pointing to Railway backend
            // Make sure we're using https for secure communication in production
            this._apiUrl = 'https://mamacycle-marketplace-production.up.railway.app/api';
            this._assetUrl = 'https://mamacycle-marketplace-production.up.railway.app';

            console.log(`Production mode - Using production API URL: ${this._apiUrl}`);
        } else {
            // Development mode
            this._apiUrl = 'http://localhost:3000/api';
            this._assetUrl = 'http://localhost:3000';
            console.log(`Development mode - Using local API URL: ${this._apiUrl}`);
        }
    }

    /**
     * Get the base API URL
     */
    get apiUrl(): string {
        return this._apiUrl;
    }

    /**
     * Get the base asset URL
     */
    get assetUrl(): string {
        return this._assetUrl;
    }

    /**
     * Get a full API endpoint URL
     * @param endpoint The endpoint path (e.g. '/products')
     */
    getApiUrl(endpoint: string): string {
        // Ensure endpoint starts with a slash
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        return `${this._apiUrl}${endpoint}`;
    }

    /**
     * Get a full asset URL
     * @param path The asset path (e.g. '/images/logo.png')
     */
    getAssetUrl(path: string): string {
        // Ensure path starts with a slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        return `${this._assetUrl}${path}`;
    }
} 