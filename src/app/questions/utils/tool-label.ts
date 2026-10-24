/** Texto que ve el usuario mientras el asistente usa cada herramienta de la API. */
const TOOL_LABELS: Readonly<Record<string, string>> = {
  get_document_details: 'Reading the document data…',
  search_document_text: 'Searching the document text…',
  find_documents: 'Searching documents…',
  sum_invoice_totals: 'Adding up invoice totals…',
};

const DEFAULT_TOOL_LABEL = 'Working on it…';

export function toolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? DEFAULT_TOOL_LABEL;
}
