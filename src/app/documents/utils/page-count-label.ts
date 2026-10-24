import { MISSING_VALUE } from './format-amount';

/** "1 page", "3 pages" o "— pages" cuando no se conoce (imágenes o sin procesar). */
export function pageCountLabel(pageCount: number | null): string {
  if (pageCount === null) {
    return `${MISSING_VALUE} pages`;
  }
  return pageCount === 1 ? '1 page' : `${pageCount} pages`;
}
