import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'stms_theme';
  isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'dark') {
      this.isDark.set(true);
      document.documentElement.classList.add('dark');
    } else if (saved === 'light') {
      this.isDark.set(false);
      document.documentElement.classList.remove('dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark);
      if (prefersDark) document.documentElement.classList.add('dark');
    }
  }

  toggle() {
    const newDark = !this.isDark();
    this.isDark.set(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(this.storageKey, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(this.storageKey, 'light');
    }
  }
}
