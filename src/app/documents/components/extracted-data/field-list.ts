import { Component, input } from '@angular/core';
import { MISSING_VALUE } from '../../utils/format-amount';

export interface LabeledValue {
  label: string;
  value: string | null;
}

/** Lista de pares etiqueta/valor; los valores null se muestran como "—". */
@Component({
  selector: 'app-field-list',
  template: `
    <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      @for (field of fields(); track field.label) {
        <div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {{ field.label }}
          </dt>
          <dd class="text-slate-900">{{ field.value ?? missingValue }}</dd>
        </div>
      }
    </dl>
  `,
})
export class FieldList {
  readonly fields = input.required<readonly LabeledValue[]>();

  protected readonly missingValue = MISSING_VALUE;
}
