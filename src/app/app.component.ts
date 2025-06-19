import { Component, OnInit } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { FlowbiteService } from './core/services/flowbite.service';
import { NgxSpinner, NgxSpinnerComponent } from 'ngx-spinner';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'mama-cycle';

  constructor(
    private flowbiteService: FlowbiteService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    // Initialize Flowbite
    this.flowbiteService.loadFlowbite((flowbite) => {
      try {
        initFlowbite();
      } catch (error) {
        console.error('Failed to initialize Flowbite:', error);
      }
    });

    // Ensure language is initialized
    console.log('Current language:', this.languageService.getCurrentLang());
  }
}
