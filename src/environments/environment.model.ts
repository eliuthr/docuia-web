/** Forma común de todos los archivos de environment, para que definan las mismas claves. */
export interface Environment {
  production: boolean;
  apiBaseUrl: string;
}
