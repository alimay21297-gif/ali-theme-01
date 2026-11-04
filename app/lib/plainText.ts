/**
 * Turns merchant-authored HTML (e.g. `store.description`) into plain text that
 * is safe to render as a React text node. Pure string work -- no DOM -- so the
 * server and the client produce the same output (no hydration mismatch).
 *
 * - Script/style blocks and comments are dropped with their content.
 * - Block-level tags and `<br>` become line breaks; every other tag is removed.
 * - Entities are decoded in ONE pass, after the tags are gone, so `&amp;` shows
 *   as `&` and an escaped `&lt;b&gt;` shows as the literal text `<b>`.
 *
 * Render the result with `whitespace-pre-line` to keep the line breaks.
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  copy: '©',
  reg: '®',
};

function decodeEntity(match: string, body: string): string {
  if (body[0] === '#') {
    const isHex = body[1] === 'x' || body[1] === 'X';
    const code = parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
    // Out-of-range or control characters stay as written.
    if (!Number.isFinite(code) || code < 32 || code > 0x10ffff) return match;
    return String.fromCodePoint(code);
  }
  return NAMED_ENTITIES[body.toLowerCase()] ?? match;
}

export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|ul|ol|h[1-6]|blockquote|tr)\s*>/gi, '\n')
    .replace(/<\/?[a-z!][^>]*>/gi, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, decodeEntity)
    .replace(/[ \t ]*\n[ \t ]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
