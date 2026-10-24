import { Component, computed, input } from '@angular/core';
import { ContractData } from '../../models/extracted-data.model';
import { formatAmount } from '../../utils/format-amount';
import { FieldList, LabeledValue } from './field-list';

@Component({
  selector: 'app-contract-details',
  imports: [FieldList],
  template: `
    <div class="space-y-6">
      <app-field-list [fields]="fields()" />

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-600">Parties</h3>
        <ul class="mt-2 space-y-1 text-slate-900">
          @for (party of data().parties; track $index) {
            <li>
              {{ party.name }}
              @if (party.role) {
                <span class="text-slate-600">— {{ party.role }}</span>
              }
            </li>
          } @empty {
            <li class="text-slate-600">No parties found.</li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class ContractDetails {
  readonly data = input.required<ContractData>();

  protected readonly fields = computed<LabeledValue[]>(() => {
    const contract = this.data();
    return [
      { label: 'Title', value: contract.title },
      { label: 'Value', value: formatAmount(contract.value, contract.currency) },
      { label: 'Effective date', value: contract.effectiveDate },
      { label: 'Expiration date', value: contract.expirationDate },
      { label: 'Governing law', value: contract.governingLaw },
    ];
  });
}
