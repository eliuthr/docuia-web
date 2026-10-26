import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/api-base-url';
import { ConversationsApi } from './conversations-api';

const BASE_URL = 'http://api.test';

describe('ConversationsApi', () => {
  let api: ConversationsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    api = TestBed.inject(ConversationsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists collection conversations without a document filter', () => {
    expect(api.conversationsUrl({ kind: 'collection' })).toBe(`${BASE_URL}/conversations`);
  });

  it('lists the conversations of one document', () => {
    expect(api.conversationsUrl({ kind: 'document', documentId: 'doc-1' })).toBe(
      `${BASE_URL}/conversations?documentId=doc-1`,
    );
  });

  it('gets one conversation with its messages', () => {
    let title = '';
    api.getConversation('conv-1').subscribe((conversation) => (title = conversation.title));

    http.expectOne(`${BASE_URL}/conversations/conv-1`).flush({ title: '¿Total?' });

    expect(title).toBe('¿Total?');
  });
});
