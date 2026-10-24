import { HttpResourceRef } from '@angular/common/http';
import { effect } from '@angular/core';

/**
 * Vuelve a pedir el recurso cada `intervalMs` mientras `shouldRefresh` sea true.
 * Cada respuesta es un objeto nuevo, así que el effect se vuelve a ejecutar tras
 * cada refresco y programa el siguiente solo si todavía hace falta.
 * Debe llamarse en un contexto de inyección (por ejemplo, el constructor).
 */
export function refreshWhile<T>(
  resource: HttpResourceRef<T | undefined>,
  shouldRefresh: (value: T) => boolean,
  intervalMs: number,
): void {
  effect((onCleanup) => {
    if (!resource.hasValue() || !shouldRefresh(resource.value() as T)) {
      return;
    }
    const timer = setTimeout(() => resource.reload(), intervalMs);
    onCleanup(() => clearTimeout(timer));
  });
}
