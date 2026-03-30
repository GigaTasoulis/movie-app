import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CollectionsService } from '../../../core/services/collections';

@Component({
  selector: 'app-collection-create',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './collection-create.html',
  styleUrl: './collection-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionCreate {
  private collectionsService = inject(CollectionsService);
  private router = inject(Router);

  readonly titleMax = 60;
  readonly descMax = 300;

  form = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]),
    description: new FormControl('', [Validators.required, Validators.maxLength(300)]),
  });

  submit(): void {
    if (this.form.invalid) return;
    this.collectionsService.createCollection(this.form.value.title!, this.form.value.description!);
    this.router.navigate(['/collections']);
  }

  cancel(): void {
    this.router.navigate(['/collections']);
  }
}
