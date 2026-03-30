import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  standalone: true,
  selector: '[appSearchInput]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: SearchInputDirective,
      multi: true,
    },
  ],
})
export class SearchInputDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) return null;

    if (value.length < 3) {
      return { minLength: 'Search term must be at least 3 characters' };
    }

    if (!/^[a-zA-Z0-9 ]*$/.test(value)) {
      return { alphanumeric: 'Search term must contain only letters and numbers' };
    }

    return null;
  }
}
