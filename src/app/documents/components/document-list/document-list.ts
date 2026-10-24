import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocumentDto } from '../../models/document.model';
import { formatFileSize } from '../../utils/format-file-size';
import { StatusBadge } from '../status-badge/status-badge';

@Component({
  selector: 'app-document-list',
  imports: [DatePipe, RouterLink, StatusBadge],
  template: `
    <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full text-left text-sm">
        <caption class="sr-only">
          Recent documents
        </caption>
        <thead class="bg-slate-50 text-slate-700">
          <tr>
            <th scope="col" class="px-4 py-3 font-semibold">Name</th>
            <th scope="col" class="px-4 py-3 font-semibold">Size</th>
            <th scope="col" class="px-4 py-3 font-semibold">Pages</th>
            <th scope="col" class="px-4 py-3 font-semibold">Status</th>
            <th scope="col" class="px-4 py-3 font-semibold">Uploaded</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 text-slate-900">
          @for (document of documents(); track document.id) {
            <tr>
              <td class="max-w-56 truncate px-4 py-3" [title]="document.originalName">
                <a
                  [routerLink]="['/documents', document.id]"
                  class="font-medium text-blue-800 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
                >
                  {{ document.originalName }}
                </a>
              </td>
              <td class="whitespace-nowrap px-4 py-3">{{ formatFileSize(document.sizeBytes) }}</td>
              <td class="px-4 py-3">
                @if (document.pageCount !== null) {
                  {{ document.pageCount }}
                } @else {
                  <span aria-label="Unknown">—</span>
                }
              </td>
              <td class="px-4 py-3">
                <app-status-badge [status]="document.status" />
                @if (document.failureReason) {
                  <p class="mt-1 max-w-64 text-xs text-red-800">{{ document.failureReason }}</p>
                }
              </td>
              <td class="whitespace-nowrap px-4 py-3">{{ document.createdAt | date: 'medium' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class DocumentList {
  readonly documents = input.required<readonly DocumentDto[]>();

  protected readonly formatFileSize = formatFileSize;
}
