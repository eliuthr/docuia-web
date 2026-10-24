import { ExtractedData } from './extracted-data.model';

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type DocumentType = 'invoice' | 'contract' | 'resume' | 'other';

export interface DocumentDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  pageCount: number | null;
  failureReason: string | null;
  documentType: DocumentType | null;
  summary: string | null;
  /** La forma depende de `documentType`. */
  extractedData: ExtractedData | null;
  createdAt: string;
  updatedAt: string;
}
