/** Links the merchant may set: a path, `#anchor` or an http(s) address. Anything else (`javascript:`, `data:`) is dropped. */
export function safeUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  const value = url.trim();
  if (!value) return undefined;
  return /^(\/|https?:\/\/|#)/i.test(value) ? value : undefined;
}

/**
 * A link (variable-list) arrives as a string, `[{ value }]` or `{ value }` — the shapes
 * the engine reads for `variable-url`. Anything else, or an unsafe address, is dropped.
 */
export function linkUrl(raw: unknown): string | undefined {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const value = first && typeof first === 'object' ? (first as { value?: unknown }).value : first;
  return safeUrl(value);
}
