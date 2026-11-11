/**
 * Links the merchant may set: a path, `#anchor` or an http(s) address. Anything else
 * (`javascript:`, `data:`) is dropped, and so is anything that could leave the store
 * through the first slash: `//host` (protocol-relative) and `/\host` (browsers read the
 * backslash as a slash). Control characters (tab, newline…) are rejected outright because
 * browsers strip them before parsing, which would turn `/\t/host` into `//host`.
 */
export function safeUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  if (/[\u0000-\u001f\u007f]/.test(url)) return undefined;
  const value = url.trim();
  if (!value) return undefined;
  return /^(\/(?![/\\])|https?:\/\/|#)/i.test(value) ? value : undefined;
}

/**
 * A CSS `url("…")` for a background image built from data. The address goes through
 * {@link safeUrl} first (so no control characters, `javascript:` or `//host`), then is
 * double-quoted with `\` and `"` escaped, so no value can end the `url()` early.
 * Returns `undefined` when the address is rejected: set no `background-image` then.
 */
export function cssUrl(value: unknown): string | undefined {
  const url = safeUrl(value);
  if (!url) return undefined;
  return `url("${url.replace(/[\\"]/g, '\\$&')}")`;
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
