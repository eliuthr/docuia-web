import { TestBed } from '@angular/core/testing';
import { DocumentDto } from '../../models/document.model';
import { DocumentList } from './document-list';

const documents: DocumentDto[] = [
  {
    id: '1',
    originalName: 'invoice-001.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
    status: 'pending',
    createdAt: '2026-10-22T18:00:00.000Z',
    updatedAt: '2026-10-22T18:00:00.000Z',
  },
  {
    id: '2',
    originalName: 'scan.png',
    mimeType: 'image/png',
    sizeBytes: 100,
    status: 'ready',
    createdAt: '2026-10-21T18:00:00.000Z',
    updatedAt: '2026-10-21T18:00:00.000Z',
  },
];

describe('DocumentList', () => {
  it('renders one row per document with name, size and status', async () => {
    const fixture = TestBed.createComponent(DocumentList);
    fixture.componentRef.setInput('documents', documents);
    await fixture.whenStable();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('invoice-001.pdf');
    expect(rows[0].textContent).toContain('2.0 KB');
    expect(rows[0].textContent).toContain('Pending');
    expect(rows[1].textContent).toContain('Ready');
  });
});
