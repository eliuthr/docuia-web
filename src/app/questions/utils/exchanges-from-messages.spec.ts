import { ConversationMessageDto } from '../models/conversation.model';
import { exchangesFromMessages } from './exchanges-from-messages';

const CREATED_AT = '2026-10-26T18:14:11.687Z';

function message(role: ConversationMessageDto['role'], text: string): ConversationMessageDto {
  return { role, text, createdAt: CREATED_AT };
}

describe('exchangesFromMessages', () => {
  it('pairs each question with the answer that follows it', () => {
    expect(
      exchangesFromMessages([
        message('user', '¿Proveedor?'),
        message('assistant', 'Tecnosuministros.'),
        message('user', '¿Total?'),
        message('assistant', '2.638.825 COP.'),
      ]),
    ).toEqual([
      { question: '¿Proveedor?', answer: 'Tecnosuministros.' },
      { question: '¿Total?', answer: '2.638.825 COP.' },
    ]);
  });

  it('keeps a question without an answer', () => {
    expect(exchangesFromMessages([message('user', '¿Total?')])).toEqual([
      { question: '¿Total?', answer: '' },
    ]);
  });

  it('ignores an answer without a question', () => {
    expect(exchangesFromMessages([message('assistant', 'Hola.')])).toEqual([]);
  });
});
