import { Component, computed, input } from '@angular/core';
import { InvoiceData } from '../../models/extracted-data.model';
import { formatAmount, MISSING_VALUE } from '../../utils/format-amount';
import { FieldList, LabeledValue } from './field-list';

@Component({
  selector: 'app-invoice-details',
  imports: [FieldList],
  template: `
    <div class="space-y-6">
      <app-field-list [fields]="fields()" />

      <div class="overflow-x-auto rounded-md border border-slate-200">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            Line items
          </caption>
          <thead class="bg-slate-50 text-slate-700">
            <tr>
              <th scope="col" class="px-3 py-2 font-semibold">Description</th>
              <th scope="col" class="px-3 py-2 text-right font-semibold">Quantity</th>
              <th scope="col" class="px-3 py-2 text-right font-semibold">Unit price</th>
              <th scope="col" class="px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-slate-900">
            @for (item of data().lineItems; track $index) {
              <tr>
                <td class="px-3 py-2">{{ item.description }}</td>
                <td class="px-3 py-2 text-right">{{ item.quantity ?? missingValue }}</td>
                <td class="whitespace-nowrap px-3 py-2 text-right">
                  {{ amount(item.unitPrice) }}
                </td>
                <td class="whitespace-nowrap px-3 py-2 text-right">{{ amount(item.amount) }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-3 py-2 text-slate-600">No line items found.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class InvoiceDetails {
  readonly data = input.required<InvoiceData>();

  protected readonly missingValue = MISSING_VALUE;

  protected readonly fields = computed<LabeledValue[]>(() => {
    const invoice = this.data();
    return [
      { label: 'Vendor', value: invoice.vendorName },
      { label: 'Vendor tax ID', value: invoice.vendorTaxId },
      { label: 'Customer', value: invoice.customerName },
      { label: 'Invoice number', value: invoice.invoiceNumber },
      { label: 'Issue date', value: invoice.issueDate },
      { label: 'Due date', value: invoice.dueDate },
      { label: 'Subtotal', value: this.amount(invoice.subtotal) },
      { label: 'Tax', value: this.amount(invoice.tax) },
      { label: 'Total', value: this.amount(invoice.total) },
    ];
  });

  protected amount(value: number | null): string {
    return formatAmount(value, this.data().currency);
  }
}
