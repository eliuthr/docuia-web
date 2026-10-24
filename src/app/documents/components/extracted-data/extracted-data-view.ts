import { Component, computed, input } from '@angular/core';
import { DocumentDto } from '../../models/document.model';
import { ContractData, InvoiceData, ResumeData } from '../../models/extracted-data.model';
import { ContractDetails } from './contract-details';
import { InvoiceDetails } from './invoice-details';
import { ResumeDetails } from './resume-details';

/** Elige la vista según el tipo; la forma de `extractedData` depende de `documentType`. */
@Component({
  selector: 'app-extracted-data-view',
  imports: [ContractDetails, InvoiceDetails, ResumeDetails],
  template: `
    @if (invoice(); as data) {
      <app-invoice-details [data]="data" />
    } @else if (contract(); as data) {
      <app-contract-details [data]="data" />
    } @else if (resume(); as data) {
      <app-resume-details [data]="data" />
    }
  `,
})
export class ExtractedDataView {
  readonly document = input.required<DocumentDto>();

  protected readonly invoice = computed(() => this.dataOfType<InvoiceData>('invoice'));
  protected readonly contract = computed(() => this.dataOfType<ContractData>('contract'));
  protected readonly resume = computed(() => this.dataOfType<ResumeData>('resume'));

  private dataOfType<T>(documentType: DocumentDto['documentType']): T | null {
    const document = this.document();
    if (document.documentType !== documentType || !document.extractedData) {
      return null;
    }
    return document.extractedData as T;
  }
}
