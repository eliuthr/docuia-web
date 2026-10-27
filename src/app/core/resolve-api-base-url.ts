import { Environment } from '../../environments/environment.model';

/** Lo escribe el despliegue en AWS junto al build (ver docuia-api/infra/lib/web-hosting.ts). */
export const RUNTIME_CONFIG_URL = '/config.json';

/**
 * La URL de la API: la del environment o, si este no la fija, la de `config.json`.
 * Sin la barra final, porque los servicios le agregan rutas como `/documents`.
 */
export async function resolveApiBaseUrl(
  environment: Environment,
  fetchConfig: typeof fetch = fetch,
): Promise<string> {
  if (environment.apiBaseUrl !== null) {
    return environment.apiBaseUrl;
  }
  // Sin caché: tras un despliegue nuevo la URL de la API puede cambiar.
  const response = await fetchConfig(RUNTIME_CONFIG_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Cannot load ${RUNTIME_CONFIG_URL} (status ${response.status}).`);
  }
  return readApiBaseUrl(await response.json()).replace(/\/+$/, '');
}

function readApiBaseUrl(config: unknown): string {
  const apiBaseUrl = (config as { apiBaseUrl?: unknown } | null)?.apiBaseUrl;
  if (typeof apiBaseUrl !== 'string' || apiBaseUrl === '') {
    throw new Error(`${RUNTIME_CONFIG_URL} has no apiBaseUrl.`);
  }
  return apiBaseUrl;
}
