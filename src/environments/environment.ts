import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  // Points to the local API until the AWS deployment (phase 6) provides the
  // API Gateway URL.
  apiBaseUrl: 'http://localhost:3000',
};
