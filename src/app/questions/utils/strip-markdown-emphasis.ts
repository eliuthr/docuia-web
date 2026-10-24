/**
 * `**texto**`, `__texto__` o `*texto*` alrededor de una palabra o frase. El
 * `_texto_` simple no se toca, para no romper nombres de archivo como `mi_factura.pdf`.
 */
const EMPHASIS_PATTERN = /(\*\*|__)(.+?)\1|(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g;

/**
 * La API pide texto plano al modelo, pero a veces igual marca negritas con
 * Markdown. Como la respuesta se muestra tal cual, se quitan esas marcas.
 * Se aplica al texto completo (no a cada trozo), porque un `**` puede llegar
 * partido en dos eventos del stream.
 */
export function stripMarkdownEmphasis(text: string): string {
  return text.replace(EMPHASIS_PATTERN, (_match, _marker, strong, emphasis) => strong ?? emphasis);
}
