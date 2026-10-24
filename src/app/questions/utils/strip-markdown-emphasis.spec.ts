import { stripMarkdownEmphasis } from './strip-markdown-emphasis';

describe('stripMarkdownEmphasis', () => {
  it('removes bold markers', () => {
    expect(stripMarkdownEmphasis('La **4-recibo-drogueria.png** suma **43.000 COP**.')).toBe(
      'La 4-recibo-drogueria.png suma 43.000 COP.',
    );
  });

  it('removes underscore bold and single-star italics', () => {
    expect(stripMarkdownEmphasis('__Total__: *pagado*')).toBe('Total: pagado');
  });

  it('keeps an unfinished marker while the answer is still streaming', () => {
    expect(stripMarkdownEmphasis('El total es **43.0')).toBe('El total es **43.0');
  });

  it('keeps list dashes, file names with underscores and multiplication signs', () => {
    const text = '- factura_final.pdf\n- 2 * 3 = 6';

    expect(stripMarkdownEmphasis(text)).toBe(text);
  });
});
