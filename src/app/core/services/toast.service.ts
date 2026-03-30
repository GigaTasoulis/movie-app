import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  dismissing: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private idCounter = 0;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', duration = 3500): void {
    const id = ++this.idCounter;
    this.toasts.update((list) => [...list, { id, message, type, dismissing: false }]);
    setTimeout(() => this.beginDismiss(id), duration);
  }

  beginDismiss(id: number): void {
    this.toasts.update((list) => list.map((t) => (t.id === id ? { ...t, dismissing: true } : t)));
    setTimeout(() => this.remove(id), 350);
  }

  private remove(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
