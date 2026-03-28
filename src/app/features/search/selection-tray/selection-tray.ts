import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
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

  private el = inject(ElementRef<HTMLElement>);

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
    this.offsetX = e.clientX - this.originX;
    this.offsetY = e.clientY - this.originY;
  }

  onPointerUp(): void {
    this.isDragging = false;
  }
}
