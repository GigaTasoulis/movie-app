import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Movie } from '../../../core/models/movie.model';

@Component({
  selector: 'app-selection-tray',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './selection-tray.html',
  styleUrl: './selection-tray.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionTrayComponent {
  @Input() movies: Movie[] = [];
  @Input() imageBaseUrl = '';
  @Output() addToCollection = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() removeMovie = new EventEmitter<Movie>();

  @ViewChild('tray') private trayRef!: ElementRef<HTMLElement>;

  isDragging = false;
  offsetX = 0;
  offsetY = 0;
  private originX = 0;
  private originY = 0;

  get previewMovies(): Movie[] {
    return this.movies.slice(0, 4);
  }

  get extraCount(): number {
    return Math.max(0, this.movies.length - 4);
  }

  onPointerDown(e: PointerEvent): void {
    if ((e.target as Element).closest('button')) return;
    this.isDragging = true;
    this.originX = e.clientX - this.offsetX;
    this.originY = e.clientY - this.offsetY;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const rawX = e.clientX - this.originX;
    const rawY = e.clientY - this.originY;

    const tray = this.trayRef?.nativeElement;
    const trayW = tray?.offsetWidth ?? 220;
    const trayH = tray?.offsetHeight ?? 150;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const gap = 2 * rem;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Natural position: bottom-right corner at (vw - gap, vh - gap)
    // Clamp so the tray never leaves the viewport
    this.offsetX = Math.min(gap, Math.max(trayW + gap - vw, rawX));
    this.offsetY = Math.min(gap, Math.max(trayH + gap - vh, rawY));
  }

  onPointerUp(): void {
    this.isDragging = false;
  }
}
