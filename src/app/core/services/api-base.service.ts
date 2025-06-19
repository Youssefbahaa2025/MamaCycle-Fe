import { Injectable } from '@angular/core';
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
        // Production is determined in the environment file now
        this._isProduction = environment.production;

        // Log environment configuration for debugging
        console.log('Environment config:', environment);
        console.log('Production mode detected:', this._isProduction);

        // Always use consistent URLs from environment
        this._apiUrl = environment.apiUrl;
        this._assetUrl = environment.assetUrl;

        console.log(`API Base Service initialized - Using API URL: ${this._apiUrl}`);
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