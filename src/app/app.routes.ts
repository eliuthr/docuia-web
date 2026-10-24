import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Documents · DocuIA',
    loadComponent: () =>
      import('./documents/pages/documents-page/documents-page').then((m) => m.DocumentsPage),
  },
  { path: '**', redirectTo: '' },
];
