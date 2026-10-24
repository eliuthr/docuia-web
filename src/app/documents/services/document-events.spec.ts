import { TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { API_BASE_URL } from '../../core/api-base-url';
import { EVENT_SOURCE_FACTORY } from '../../core/event-source-factory';
import { FakeEventSource, fakeEventSourceFactory } from '../../core/testing/fake-event-source';
import { DocumentChange } from '../models/document-change.model';
import { DocumentEvents } from './document-events';

describe('DocumentEvents', () => {
  let events: DocumentEvents;
  let received: DocumentChange[];
  let subscription: Subscription;

  beforeEach(() => {
    FakeEventSource.reset();
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: 'http://api.test' },
        { provide: EVENT_SOURCE_FACTORY, useValue: fakeEventSourceFactory },
      ],
    });
    events = TestBed.inject(DocumentEvents);
    received = [];
    subscription = events.changes.subscribe((change) => received.push(change));
  });

  afterEach(() => subscription.unsubscribe());

  it('connects to the events endpoint on the first subscriber', () => {
    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.latest().url).toBe('http://api.test/documents/events');
  });

  it('shares one connection between subscribers', () => {
    const second = events.changes.subscribe();

    expect(FakeEventSource.instances).toHaveLength(1);
    second.unsubscribe();
  });

  it('emits status changes and ignores invalid ones', () => {
    const source = FakeEventSource.latest();

    source.emit('document.updated', '{"documentId":"doc-1","status":"ready"}');
    source.emit('document.updated', '{"documentId":"doc-1","status":"deleted"}');
    source.emit('document.updated', 'not json');
    source.emit('ping', '{}');

    expect(received).toEqual([{ kind: 'status', documentId: 'doc-1', status: 'ready' }]);
  });

  it('tracks the connection state', () => {
    const source = FakeEventSource.latest();
    expect(events.isConnected()).toBe(false);

    source.open();
    expect(events.isConnected()).toBe(true);

    source.fail();
    expect(events.isConnected()).toBe(false);
  });

  it('asks for a resync when the connection comes back, not on the first open', () => {
    const source = FakeEventSource.latest();

    source.open();
    source.fail();
    source.open();

    expect(received).toEqual([{ kind: 'resync' }]);
  });

  it('closes the connection when the last subscriber leaves', () => {
    const source = FakeEventSource.latest();
    source.open();

    subscription.unsubscribe();

    expect(source.isClosed).toBe(true);
    expect(events.isConnected()).toBe(false);
  });
});
