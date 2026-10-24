import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../../core/api-error-message';
import { DocumentDto } from '../../models/document.model';
import { DocumentsApi } from '../../services/documents-api';
import { ACCEPT_ATTRIBUTE, MAX_UPLOAD_SIZE_MB } from '../../documents.constants';
import { formatFileSize } from '../../utils/format-file-size';
import { validateDocumentFile } from '../../utils/validate-document-file';

interface Feedback {
  kind: 'success' | 'error';
  text: string;
}

@Component({
  selector: 'app-upload-form',
  templateUrl: './upload-form.html',
})
export class UploadForm {
  readonly uploaded = output<DocumentDto>();

  private readonly api = inject(DocumentsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly validationError = signal<string | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly isDragging = signal(false);
  protected readonly feedback = signal<Feedback | null>(null);

  protected readonly canUpload = computed(
    () => this.selectedFile() !== null && this.validationError() === null && !this.isUploading(),
  );

  protected readonly accept = ACCEPT_ATTRIBUTE;
  protected readonly maxSizeMb = MAX_UPLOAD_SIZE_MB;
  protected readonly formatFileSize = formatFileSize;

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectFile(input.files?.item(0) ?? null);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    this.selectFile(event.dataTransfer?.files.item(0) ?? null);
  }

  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const file = this.selectedFile();
    if (!file || !this.canUpload()) {
      return;
    }
    this.upload(file);
  }

  private selectFile(file: File | null): void {
    this.feedback.set(null);
    this.selectedFile.set(file);
    this.validationError.set(file ? validateDocumentFile(file) : null);
  }

  private upload(file: File): void {
    this.isUploading.set(true);
    this.api
      .upload(file)
      .pipe(
        finalize(() => this.isUploading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (document) => this.onUploaded(document),
        error: (error: unknown) =>
          this.feedback.set({ kind: 'error', text: apiErrorMessage(error) }),
      });
  }

  private onUploaded(document: DocumentDto): void {
    this.feedback.set({ kind: 'success', text: `"${document.originalName}" was uploaded.` });
    this.selectedFile.set(null);
    this.fileInput().nativeElement.value = '';
    this.uploaded.emit(document);
  }
}
