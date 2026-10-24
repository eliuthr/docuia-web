export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface DocumentDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}
