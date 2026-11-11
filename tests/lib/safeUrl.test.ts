import { describe, expect, it } from 'vitest';
import { cssUrl, linkUrl, safeUrl } from '../../app/lib/safeUrl';

describe('safeUrl', () => {
  it('keeps paths, anchors and http(s) addresses', () => {
    expect(safeUrl('/')).toBe('/');
    expect(safeUrl('/ar/products')).toBe('/ar/products');
    expect(safeUrl('#faq')).toBe('#faq');
    expect(safeUrl('https://store.example/p/1')).toBe('https://store.example/p/1');
    expect(safeUrl('  /about  ')).toBe('/about');
  });

  it('drops script and data schemes and non-strings', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('data:text/html,<b>x</b>')).toBeUndefined();
    expect(safeUrl('mailto:a@b.c')).toBeUndefined();
    expect(safeUrl('')).toBeUndefined();
    expect(safeUrl(null)).toBeUndefined();
    expect(safeUrl(42)).toBeUndefined();
  });

  it('rejects protocol-relative and backslash hosts', () => {
    expect(safeUrl('//evil.com')).toBeUndefined();
    expect(safeUrl('  //evil.com/x')).toBeUndefined();
    expect(safeUrl('/\\evil.com')).toBeUndefined();
    expect(safeUrl('/\\/evil.com')).toBeUndefined();
  });

  it('rejects control characters anywhere in the value', () => {
    expect(safeUrl('/\t/evil.com')).toBeUndefined();
    expect(safeUrl('/\n/evil.com')).toBeUndefined();
    expect(safeUrl('java\tscript:alert(1)')).toBeUndefined();
    expect(safeUrl('/ok\u0000')).toBeUndefined();
    expect(safeUrl('https://a.b/\r\nx')).toBeUndefined();
  });
});

describe('cssUrl', () => {
  it('quotes an https address and a relative path', () => {
    expect(cssUrl('https://cdn.salla.network/a.jpg')).toBe('url("https://cdn.salla.network/a.jpg")');
    expect(cssUrl('/images/a.jpg')).toBe('url("/images/a.jpg")');
  });

  it('drops rejected, empty and non-string values', () => {
    expect(cssUrl('javascript:alert(1)')).toBeUndefined();
    expect(cssUrl('//evil.com/a.jpg')).toBeUndefined();
    expect(cssUrl('https://a.b/\nx')).toBeUndefined();
    expect(cssUrl('')).toBeUndefined();
    expect(cssUrl(undefined)).toBeUndefined();
  });

  it('escapes quotes and backslashes so the value cannot end the url() early', () => {
    expect(cssUrl('https://a.b/x")y')).toBe('url("https://a.b/x\\")y")');
    expect(cssUrl('https://a.b/x\\y')).toBe('url("https://a.b/x\\\\y")');
  });
});

describe('linkUrl', () => {
  it('reads string, [{value}] and {value} shapes through the same check', () => {
    expect(linkUrl('/a')).toBe('/a');
    expect(linkUrl([{ value: '/b' }])).toBe('/b');
    expect(linkUrl({ value: '/c' })).toBe('/c');
    expect(linkUrl([{ value: '//evil.com' }])).toBeUndefined();
    expect(linkUrl({ value: '/\\evil.com' })).toBeUndefined();
  });
});
