import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideApiBaseUrl } from './app/core/api-base-url';
import { resolveApiBaseUrl } from './app/core/resolve-api-base-url';
import { environment } from './environments/environment';

resolveApiBaseUrl(environment)
  .then((apiBaseUrl) =>
    bootstrapApplication(
      App,
      mergeApplicationConfig(appConfig, { providers: [provideApiBaseUrl(apiBaseUrl)] }),
    ),
  )
  .catch((err) => console.error(err));
