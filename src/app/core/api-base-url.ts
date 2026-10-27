import { InjectionToken, Provider } from '@angular/core';

/** Se provee al arrancar (ver main.ts), cuando ya se conoce la URL de la API. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export function provideApiBaseUrl(apiBaseUrl: string): Provider {
  return { provide: API_BASE_URL, useValue: apiBaseUrl };
}
