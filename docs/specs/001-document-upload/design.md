# 001 — Document upload UI: design

## Structure

```
src/app/
├── app.ts / app.html            shell: header + <router-outlet>
├── app.config.ts                provideHttpClient() (fetch is the default backend), router
├── app.routes.ts                '' → lazy documents page
├── core/
│   └── api-base-url.ts          API_BASE_URL injection token (default http://localhost:3000)
└── documents/                         one folder per kind of file
    ├── documents.constants.ts         allowed types, max size, list limit
    ├── models/
    │   └── document.model.ts          DocumentDto, DocumentStatus
    ├── services/
    │   └── documents-api.ts           @Service: upload(file), list URL builder
    ├── utils/
    │   ├── validate-document-file.ts  pure function → error message | null
    │   └── format-file-size.ts        pure function
    ├── pages/
    │   └── documents-page/            composes the feature, owns the list resource
    └── components/                    one folder per component (ts, html, spec)
        ├── upload-form/               file picker + drop zone, emits `uploaded`
        ├── document-list/             table of documents (input)
        └── status-badge/              text + color badge (input)
```

Pages are routed and compose components; components only receive inputs and emit outputs (except
`upload-form`, which calls the API to keep the page small).

## Data flow

```
DocumentsPage
 ├─ documents = httpResource<DocumentDto[]>(() => api.listUrl())
 ├─ <app-upload-form (uploaded)="documents.reload()" />
 └─ <app-document-list [documents]="documents.value()" />  + loading / empty / error states
```

- `httpResource` (Angular's signal-based HTTP fetcher) exposes `value`, `isLoading`, `error` and
  `reload()`, so the page needs no manual subscription.
- `UploadForm` owns its local state with signals: `selectedFile`, `validationError`,
  `isUploading`, `feedback`. It calls `DocumentsApi.upload()` and converts the result into a
  message for an `aria-live="polite"` region.
- Errors: `DocumentsApi` maps `HttpErrorResponse` to a readable message using the API's
  `{ message }` body (string or list); status `0` → "Cannot reach the server".

## Configuration

Values live in `src/environments/` (generated with `ng generate environments`):
`environment.ts` is the production build and `environment.development.ts` replaces it in the
development configuration (`ng serve`) through `fileReplacements` in `angular.json`. Both are typed
with the `Environment` interface so they always define the same keys.

`API_BASE_URL` is an `InjectionToken<string>` whose root factory returns
`environment.apiBaseUrl`; only that token reads the environment, and tests override it with a
provider. The API
already allows the `http://localhost:4200` origin via CORS.

## Styling

Tailwind utility classes, neutral palette, focus rings via `focus-visible:`. Status badge colors
meet 4.5:1 contrast: pending → amber-900 on amber-100, processing → blue-900 on blue-100,
ready → green-900 on green-100, failed → red-900 on red-100.

## Testing

- `DocumentsApi`: `HttpTestingController` checks the multipart request and error mapping.
- `validateDocumentFile`, `formatFileSize`: pure-function tests.
- `UploadForm`: validation errors, button state, success and failure flows with a stubbed API.
- `DocumentList` / `StatusBadge`: rendering.
- `DocumentsPage`: loading, empty and error states with `HttpTestingController`.
