import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
    name: 'imageUrl',
    standalone: true
})
export class ImageUrlPipe implements PipeTransform {
    transform(imagePath: string | undefined): string {
        if (!imagePath) {
            return '/product-placeholder.jpg';
        }

        // If it's already a full URL, return as is
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // For relative paths, prepend the asset URL
        return `${environment.assetUrl}/${imagePath}`;
    }
} 