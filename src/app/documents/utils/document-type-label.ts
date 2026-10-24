import { DocumentType } from '../models/document.model';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Invoice',
  contract: 'Contract',
  resume: 'Résumé',
  other: 'Other',
};

export const UNCLASSIFIED_LABEL = 'Not classified';

export function documentTypeLabel(documentType: DocumentType | null): string {
  return documentType ? DOCUMENT_TYPE_LABELS[documentType] : UNCLASSIFIED_LABEL;
}
