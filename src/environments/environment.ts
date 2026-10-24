import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  // Apunta a la API local hasta que el despliegue en AWS (fase 6) dé la
  // URL de API Gateway.
  apiBaseUrl: 'http://localhost:3000',
};
