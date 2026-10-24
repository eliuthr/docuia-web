/** Shape shared by every environment file, so all of them define the same keys. */
export interface Environment {
  production: boolean;
  apiBaseUrl: string;
}
