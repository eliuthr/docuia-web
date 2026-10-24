import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DocumentDto } from '../../models/document.model';
import { DocumentsApi } from '../../services/documents-api';
import { UploadForm } from './upload-form';

const uploadedDocument: DocumentDto = {
  id: '1',
  originalName: 'invoice.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 4,
  status: 'pending',
  createdAt: '2026-10-22T18:00:00.000Z',
  updatedAt: '2026-10-22T18:00:00.000Z',
};

describe('UploadForm', () => {
  let fixture: ComponentFixture<UploadForm>;
  let element: HTMLElement;
  let api: { upload: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = { upload: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: DocumentsApi, useValue: api }] });
    fixture = TestBed.createComponent(UploadForm);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  async function selectFile(file: File): Promise<void> {
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: { item: () => file }, configurable: true });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  function uploadButton(): HTMLButtonElement {
    return element.querySelector('button[type="submit"]')!;
  }

  const pdf = () => new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' });

  it('keeps the button disabled until a file is selected', () => {
    expect(uploadButton().disabled).toBe(true);
  });

  it('enables the button for a valid file and shows its name', async () => {
    await selectFile(pdf());

    expect(uploadButton().disabled).toBe(false);
    expect(element.textContent).toContain('invoice.pdf');
  });

  it('shows an error and keeps the button disabled for an invalid type', async () => {
    await selectFile(new File(['hi'], 'notes.txt', { type: 'text/plain' }));

    expect(uploadButton().disabled).toBe(true);
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Only PDF');
  });

  it('uploads, announces success and emits the document', async () => {
    api.upload.mockReturnValue(of(uploadedDocument));
    const emitted: DocumentDto[] = [];
    fixture.componentInstance.uploaded.subscribe((document) => emitted.push(document));

    await selectFile(pdf());
    await submit();

    expect(api.upload).toHaveBeenCalledOnce();
    expect(emitted).toEqual([uploadedDocument]);
    expect(element.querySelector('[aria-live]')?.textContent).toContain('was uploaded');
    expect(uploadButton().disabled).toBe(true);
  });

  it('shows the API error and keeps the selection on failure', async () => {
    api.upload.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 400, error: { message: 'Validation failed' } }),
      ),
    );

    await selectFile(pdf());
    await submit();

    expect(element.querySelector('[aria-live]')?.textContent).toContain('Validation failed');
    expect(uploadButton().disabled).toBe(false);
  });
});
