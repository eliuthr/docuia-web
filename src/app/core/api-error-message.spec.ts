import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error-message';

describe('apiErrorMessage', () => {
  it('uses the API message', () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: 'File is required' } });
    expect(apiErrorMessage(error)).toBe('File is required');
  });

  it('joins a list of validation messages', () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: ['a.', 'b.'] } });
    expect(apiErrorMessage(error)).toBe('a. b.');
  });

  it('explains when the server is unreachable', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Cannot reach');
  });

  it('falls back to a generic message', () => {
    expect(apiErrorMessage(new Error('boom'))).toContain('Something went wrong');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 500, error: 'oops' }))).toContain(
      'Something went wrong',
    );
  });
});
