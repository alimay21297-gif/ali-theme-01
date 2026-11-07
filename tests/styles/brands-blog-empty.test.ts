// @vitest-environment node
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type Root, type Rule } from 'postcss';
import tailwindcss from 'tailwindcss';

const themeRoot = fileURLToPath(new URL('../../', import.meta.url));
const tailwindConfig = createRequire(import.meta.url)(`${themeRoot}tailwind.config.cjs`);

async function compile(file: string): Promise<Root> {
  const { css } = sass.compile(`${themeRoot}app/styles/${file}`);
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

function find(root: Root, selector: string): Rule[] {
  const found: Rule[] = [];
  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) found.push(rule);
  });
  return found;
}

describe('brands letter nav', () => {
  it('makes every letter a 44px target, also in the sticky column', async () => {
    const root = await compile('04-components/brands.scss');

    const [item] = find(root, '.brands-nav__item');
    expect(decl(item, 'width')).toBe('2.75rem');
    expect(decl(item, 'height')).toBe('2.75rem');

    // Sticky below 1280px: 24px look, 44px cell, 44px hit area, no overlap.
    const cells = find(root, '.brands-nav.is-sticky li');
    expect(cells.some((c) => decl(c, 'width') === '2.75rem' && decl(c, 'height') === '2.75rem')).toBe(
      true
    );
    const hit = find(root, '.brands-nav.is-sticky .brands-nav__item::after');
    expect(hit).toHaveLength(1);
    // 24px item + 2 × 10px = 44px.
    expect(decl(hit[0], 'inset')).toBe('-0.625rem');
  });
});

describe('engine NoContent restyle', () => {
  it('never styles our own EmptyState', async () => {
    const root = await compile('04-components/no-content-placeholder.scss');
    const restyled: string[] = [];
    root.walkRules((rule) => {
      for (const sel of rule.selectors) {
        if (/\.no-content-placeholder.*(\.icon|\sp$|\.btn)/.test(sel)) restyled.push(sel);
      }
    });

    // The shared layout rule is unscoped; every icon / text / link rule is scoped.
    const unscoped = restyled.filter((sel) => !sel.includes(':not(.s-empty-state)'));
    const shared = unscoped.filter((sel) => sel !== '.no-content-placeholder .icon' && sel !== '.no-content-placeholder p');
    expect(shared).toEqual([]);
    expect(restyled.some((s) => s.includes(':not(.s-empty-state) .btn'))).toBe(true);
  });

  it('makes the link a 44px pill', async () => {
    const root = await compile('04-components/no-content-placeholder.scss');
    const [btn] = find(root, '.no-content-placeholder:not(.s-empty-state) .btn');
    expect(decl(btn, 'min-height')).toBe('2.75rem');
    expect(decl(btn, 'border-radius')).toBe('9999px');
  });
});

describe('blog tap targets', () => {
  it('gives the like button and the tags toggle a 44px minimum', async () => {
    const root = await compile('04-components/user-pages.scss');
    const [like] = find(root, '#blog-like');
    expect(decl(like, 'min-height')).toBe('2.75rem');
    expect(decl(like, 'min-width')).toBe('2.75rem');
    const [more] = find(root, '.s-blog-tags .s-blog-tags-more');
    expect(decl(more, 'min-height')).toBe('2.75rem');
    expect(decl(more, 'min-width')).toBe('2.75rem');
    const [tag] = find(root, '.s-blog-tags .s-blog-tags-item');
    expect(decl(tag, 'min-height')).toBe('2.75rem');
  });
});
