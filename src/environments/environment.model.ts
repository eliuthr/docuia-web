/** Forma común de todos los archivos de environment, para que definan las mismas claves. */
export interface Environment {
  production: boolean;
  /**
   * URL fija de la API, o `null` para leerla al arrancar desde `config.json`.
   * En AWS la URL solo se conoce al desplegar, así que el despliegue escribe ese archivo.
   */
  apiBaseUrl: string | null;
}
