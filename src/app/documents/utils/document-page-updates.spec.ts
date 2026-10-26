import { DocumentPageDto } from '../models/document.model';
import { buildDocument } from '../testing/build-document';
import {
  isLabelOnlyChange,
  isListed,
  withDocument,
  withNewDocument,
  withStatus,
} from './document-page-updates';

const page: DocumentPageDto = {
  items: [buildDocument({ id: 'a', status: 'pending' }), buildDocument({ id: 'b' })],
  nextCursor: 'next',
};

describe('document page updates', () => {
  it('changes only the status of the matching document', () => {
    const updated = withStatus(page, 'a', 'processing');

    expect(updated.items.map((document) => document.status)).toEqual(['processing', 'ready']);
    expect(updated.items[1]).toBe(page.items[1]);
    expect(updated.nextCursor).toBe('next');
    expect(page.items[0].status).toBe('pending');
  });

  it('replaces a document with its latest version', () => {
    const latest = buildDocument({ id: 'a', summary: 'Nuevo resumen.' });

    expect(withDocument(page, latest).items[0]).toBe(latest);
  });

  it('leaves the page unchanged for a document that is not listed', () => {
    expect(withStatus(page, 'zzz', 'ready').items).toEqual(page.items);
  });

  it('puts a new document first and keeps the cursor', () => {
    const created = buildDocument({ id: 'new' });
    const updated = withNewDocument(page, created);

    expect(updated.items.map((document) => document.id)).toEqual(['new', 'a', 'b']);
    expect(updated.nextCursor).toBe('next');
    expect(page.items).toHaveLength(2);
  });

  it('does not duplicate a new document that is already listed', () => {
    const latest = buildDocument({ id: 'a', status: 'processing' });

    expect(withNewDocument(page, latest).items).toEqual([latest, page.items[1]]);
  });

  it('knows which documents are listed', () => {
    expect(isListed(page, 'b')).toBe(true);
    expect(isListed(page, 'zzz')).toBe(false);
  });

  it('treats pending and processing as label-only changes', () => {
    expect(isLabelOnlyChange('processing')).toBe(true);
    expect(isLabelOnlyChange('ready')).toBe(false);
    expect(isLabelOnlyChange('failed')).toBe(false);
  });
});
