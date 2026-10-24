import { TestBed } from '@angular/core/testing';
import { DocumentDto } from '../../models/document.model';
import {
  buildContractData,
  buildDocument,
  buildInvoiceData,
  buildResumeData,
} from '../../testing/build-document';
import { ExtractedDataView } from './extracted-data-view';

async function render(document: DocumentDto): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(ExtractedDataView);
  fixture.componentRef.setInput('document', document);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

/** Texto sin espacios duros ni saltos, para comparar montos formateados. */
function textOf(element: HTMLElement): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ');
}

/** Valor que acompaña a una etiqueta en la lista de campos. */
function fieldValue(element: HTMLElement, label: string): string | undefined {
  const terms = Array.from(element.querySelectorAll('dt'));
  const term = terms.find((candidate) => candidate.textContent?.trim() === label);
  return term?.nextElementSibling?.textContent?.trim();
}

describe('ExtractedDataView', () => {
  it('shows the invoice fields and line items with formatted amounts', async () => {
    const element = await render(buildDocument());

    expect(fieldValue(element, 'Vendor')).toBe('Tecnosuministros del Caribe S.A.S.');
    expect(fieldValue(element, 'Total')?.replace(/\s/g, ' ')).toBe('COP 2,638,825');
    const rows = element.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(textOf(rows[0] as HTMLElement)).toContain('Resma papel carta');
    expect(textOf(rows[0] as HTMLElement)).toContain('COP 122,500');
  });

  it('shows a dash for missing invoice fields', async () => {
    const element = await render(
      buildDocument({ extractedData: buildInvoiceData({ customerName: null, total: null }) }),
    );

    expect(fieldValue(element, 'Customer')).toBe('—');
    expect(fieldValue(element, 'Total')).toBe('—');
  });

  it('shows a contract with its parties and value', async () => {
    const element = await render(
      buildDocument({ documentType: 'contract', extractedData: buildContractData() }),
    );

    expect(fieldValue(element, 'Value')?.replace(/\s/g, ' ')).toBe('COP 8,000,000');
    expect(fieldValue(element, 'Governing law')).toBe('—');
    const parties = Array.from(element.querySelectorAll('li')).map((item) => textOf(item).trim());
    expect(parties).toEqual([
      'Clínica Dental Sonrisas del Sinú S.A.S. — EL CONTRATANTE',
      'Juan David Arrieta Padilla',
    ]);
  });

  it('shows a résumé with skills, current job and education', async () => {
    const element = await render(
      buildDocument({ documentType: 'resume', extractedData: buildResumeData() }),
    );

    expect(fieldValue(element, 'Name')).toBe('Andrés Felipe Coronado Mercado');
    expect(textOf(element)).toContain('TypeScript');
    expect(textOf(element)).toContain('Full Stack at Innova Digital Ltda.');
    expect(textOf(element)).toContain('2024-01 – Present');
    expect(textOf(element)).toContain('Ingeniería de Sistemas — Universidad de Sucre (2021)');
  });

  it('renders nothing for other documents', async () => {
    const element = await render(buildDocument({ documentType: 'other', extractedData: null }));

    expect(textOf(element).trim()).toBe('');
  });
});
