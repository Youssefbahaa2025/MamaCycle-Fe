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
        // Force development mode for local testing
        this._isProduction = false;

        // Log environment configuration for debugging
        console.log('Environment config:', environment);
        console.log('Using development mode for API connections');

        // Always use localhost URLs
        this._apiUrl = 'http://localhost:3000/api';
        this._assetUrl = 'http://localhost:3000';
        console.log(`API Base Service initialized - Using local API URL: ${this._apiUrl}`);
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