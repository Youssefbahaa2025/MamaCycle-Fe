// src/app/core/services/spinner.service.ts
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({ providedIn: 'root' })
export class SpinnerService {
    private count = 0;
    constructor(private spinner: NgxSpinnerService) { }

    show(): void {
        if (++this.count === 1) {
            this.spinner.show();
        }
    }

    hide(): void {
        if (this.count > 0 && --this.count === 0) {
            this.spinner.hide();
        }
    }
}
