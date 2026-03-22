import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private platformId = inject(PLATFORM_ID);
  theme: 'system' | 'light' | 'dark' = 'dark';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('theme') as 'system' | 'light' | 'dark';
      this.theme = stored || 'dark';
      this.applyTheme();
    }
  }

  setTheme(theme: 'system' | 'light' | 'dark'): void {
    this.theme = theme;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', theme);
      this.applyTheme();
    }
  }

  private applyTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = this.theme === 'dark' || (this.theme === 'system' && prefersDark);
    document.body.classList.toggle('light-mode', !isDark);
  }
}