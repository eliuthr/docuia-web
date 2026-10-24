import { Component, computed, input } from '@angular/core';
import { DocumentStatus } from '../../models/document.model';

const BADGE_STYLES: Record<DocumentStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-900' },
  processing: { label: 'Processing', classes: 'bg-blue-100 text-blue-900' },
  ready: { label: 'Ready', classes: 'bg-green-100 text-green-900' },
  failed: { label: 'Failed', classes: 'bg-red-100 text-red-900' },
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span
      class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {{ style().classes }}"
    >
      {{ style().label }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<DocumentStatus>();

  protected readonly style = computed(() => BADGE_STYLES[this.status()]);
}
