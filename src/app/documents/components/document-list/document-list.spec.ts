import { TestBed } from '@angular/core/testing';
import { DocumentDto } from '../../models/document.model';
import { DocumentList } from './document-list';

const documents: DocumentDto[] = [
  {
    id: '1',
    originalName: 'invoice-001.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
    status: 'ready',
    pageCount: 3,
    failureReason: null,
    createdAt: '2026-10-22T18:00:00.000Z',
    updatedAt: '2026-10-22T18:00:00.000Z',
  },
  {
    id: '2',
    originalName: 'scan.png',
    mimeType: 'image/png',
    sizeBytes: 100,
    status: 'pending',
    pageCount: null,
    failureReason: null,
    createdAt: '2026-10-21T18:00:00.000Z',
    updatedAt: '2026-10-21T18:00:00.000Z',
  },
  {
    id: '3',
    originalName: 'broken.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 50,
    status: 'failed',
    pageCount: null,
    failureReason: 'The PDF file is corrupt or cannot be read.',
    createdAt: '2026-10-20T18:00:00.000Z',
    updatedAt: '2026-10-20T18:00:00.000Z',
  },
];

describe('DocumentList', () => {
  async function renderRows(): Promise<NodeListOf<HTMLTableRowElement>> {
    const fixture = TestBed.createComponent(DocumentList);
    fixture.componentRef.setInput('documents', documents);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
  }

  it('renders one row per document with name, size, pages and status', async () => {
    const rows = await renderRows();

    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('invoice-001.pdf');
    expect(rows[0].textContent).toContain('2.0 KB');
    expect(rows[0].cells[2].textContent?.trim()).toBe('3');
    expect(rows[0].textContent).toContain('Ready');
    expect(rows[1].textContent).toContain('Pending');
  });

  it('shows a dash when the page count is unknown', async () => {
    const rows = await renderRows();

    expect(rows[1].cells[2].textContent?.trim()).toBe('—');
  });

  it('shows the failure reason of a failed document', async () => {
    const rows = await renderRows();

    expect(rows[2].textContent).toContain('Failed');
    expect(rows[2].textContent).toContain('The PDF file is corrupt or cannot be read.');
    expect(rows[0].querySelector('p')).toBeNull();
  });
});
