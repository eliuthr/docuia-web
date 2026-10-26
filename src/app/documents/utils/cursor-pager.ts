import { computed, signal } from '@angular/core';

/**
 * Navegación "anterior / siguiente" con cursores. La API solo avanza, así que
 * se guarda el cursor de cada página visitada para poder volver.
 */
export class CursorPager {
  /** El primero es null: la primera página no lleva cursor. */
  private readonly visited = signal<readonly (string | null)[]>([null]);

  readonly currentCursor = computed(() => this.visited().at(-1) ?? null);
  readonly pageNumber = computed(() => this.visited().length);
  readonly isFirstPage = computed(() => this.visited().length === 1);

  next(nextCursor: string): void {
    this.visited.update((cursors) => [...cursors, nextCursor]);
  }

  previous(): void {
    this.visited.update((cursors) => (cursors.length > 1 ? cursors.slice(0, -1) : cursors));
  }

  reset(): void {
    this.visited.set([null]);
  }
}
