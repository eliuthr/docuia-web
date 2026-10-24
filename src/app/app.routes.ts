import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Documents · DocuIA',
    loadComponent: () =>
      import('./documents/pages/documents-page/documents-page').then((m) => m.DocumentsPage),
  },
  {
    path: 'documents/:id',
    title: 'Document · DocuIA',
    loadComponent: () =>
      import('./documents/pages/document-detail-page/document-detail-page').then(
        (m) => m.DocumentDetailPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
