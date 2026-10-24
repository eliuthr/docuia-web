export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface DocumentDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  pageCount: number | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}
