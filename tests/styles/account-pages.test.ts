// @vitest-environment node
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type Root, type Rule } from 'postcss';
import tailwindcss from 'tailwindcss';

const themeRoot = fileURLToPath(new URL('../../', import.meta.url));
const tailwindConfig = createRequire(import.meta.url)(`${themeRoot}tailwind.config.cjs`);
const styles = `${themeRoot}app/styles/04-components/`;

async function compile(file: string): Promise<Root> {
  const { css } = sass.compile(`${styles}${file}`);
  const result = await postcss([
    tailwindcss({ ...tailwindConfig, content: [{ raw: '' }] }),
  ]).process(css, { from: undefined });
  return result.root;
}

function decl(rule: Rule, prop: string): string | undefined {
  let value: string | undefined;
  rule.walkDecls(prop, (d) => {
    value = d.value;
  });
  return value;
}

function find(root: Root, test: (selector: string) => boolean): Rule[] {
  const found: Rule[] = [];
  root.walkRules((rule) => {
    if (rule.selectors.some(test)) found.push(rule);
  });
  return found;
}

describe('account pages', () => {
  it('has no hex literal left in the touched account styles', () => {
    for (const file of ['user-pages.scss', 'mobile-account-sheet.scss', 'user-menu.scss', 'loyalty.scss']) {
      const code = readFileSync(`${styles}${file}`, 'utf8');
      // Only `#rrggbb`-style literals; ids like `#wishlist` and `#blog-like` have no hex-only name.
      expect(code.match(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b(?![\w-])/g) ?? []).toEqual([]);
    }
  });

  it('uses the sale token for the logout red and the wishlist sale price', async () => {
    const sheet = await compile('mobile-account-sheet.scss');
    const close = find(sheet, (s) => s === '.account-sheet .bottom-sheet__close');
    expect(close.some((r) => decl(r, 'color') === 'var(--lameem-sale)')).toBe(true);

    const pages = await compile('user-pages.scss');
    const price = find(pages, (s) => s.includes('h4.text-red-400'));
    expect(price).toHaveLength(1);
    expect(decl(price[0], 'color')).toBe('var(--lameem-sale)');
  });

  it('makes order pills, small buttons and the wishlist checkbox 44px', async () => {
    const pages = await compile('user-pages.scss');

    const [pill] = find(pages, (s) => s === '.s-orders-filters-item');
    expect(decl(pill, 'min-height')).toBe('2.75rem');

    const small = find(pages, (s) => s.includes('.single-order-header-item .salla-button.salla-button--small'));
    expect(small.some((r) => decl(r, 'min-height') === '2.75rem')).toBe(true);

    const box = find(pages, (s) => s === '.product-entry--wishlist .s-wishlist-select');
    expect(box.some((r) => decl(r, 'width') === '2.75rem' && decl(r, 'height') === '2.75rem')).toBe(true);
    // The drawn box keeps the old 20px look.
    const drawn = find(pages, (s) => s === '.product-entry--wishlist .s-wishlist-select::before');
    expect(drawn.some((r) => decl(r, 'width') === '1.25rem' && decl(r, 'height') === '1.25rem')).toBe(true);

    const [note] = find(pages, (s) => s === '.s-notifications-item');
    expect(decl(note, 'min-height')).toBe('2.75rem');
  });
});
