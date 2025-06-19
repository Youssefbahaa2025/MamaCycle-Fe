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
        // Log environment configuration for debugging
        console.log('Environment config:', environment);

        // Force API URL to use the correct environment
        this._apiUrl = isDevMode()
            ? 'http://localhost:3000/api'
            : 'https://mamacycle-marketplace-production.up.railway.app/api';

        this._assetUrl = isDevMode()
            ? 'http://localhost:3000'
            : 'https://mamacycle-marketplace-production.up.railway.app';

        this._isProduction = !isDevMode();

        console.log(`API Base Service initialized - Using API URL: ${this._apiUrl}`);
        console.log(`Production mode: ${this._isProduction}`);
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