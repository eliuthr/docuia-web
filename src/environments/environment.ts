import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  // El despliegue en AWS (docuia-api/infra) escribe la URL en config.json.
  apiBaseUrl: null,
};
