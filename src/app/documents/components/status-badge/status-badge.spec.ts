import { TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it.each([
    ['pending', 'Pending'],
    ['processing', 'Processing'],
    ['ready', 'Ready'],
    ['failed', 'Failed'],
  ] as const)('shows %s as text', async (status, label) => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', status);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe(label);
  });
});
