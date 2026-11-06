/** Links the merchant may set: a path, `#anchor` or an http(s) address. Anything else (`javascript:`, `data:`) is dropped. */
export function safeUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  const value = url.trim();
  if (!value) return undefined;
  return /^(\/|https?:\/\/|#)/i.test(value) ? value : undefined;
}
