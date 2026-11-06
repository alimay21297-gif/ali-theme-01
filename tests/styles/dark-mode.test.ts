// @vitest-environment node
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type Root } from 'postcss';
import tailwindcss from 'tailwindcss';

const themeRoot = fileURLToPath(new URL('../../', import.meta.url));
const tailwindConfig = createRequire(import.meta.url)(`${themeRoot}tailwind.config.cjs`);

async function compile(file: string): Promise<Root> {
  const { css } = sass.compile(`${themeRoot}app/styles/04-components/${file}`);
  const result = await postcss([
    tailwindcss({ ...tailwindConfig, content: [{ raw: '' }] }),
  ]).process(css, { from: undefined });
  return result.root;
}

function declarations(root: Root, selector: string): Record<string, string> {
  const decls: Record<string, string> = {};
  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) {
      rule.walkDecls((decl) => {
        decls[decl.prop] = decl.value;
      });
    }
  });
  return decls;
}

describe('footer_is_dark (body.footer-is-dark)', () => {
  // The footer's own background/text colors for this setting moved into the
  // Footer component itself (@salla.sa/twilight-theme-engine/layout) along
  // with the rest of its structure -- see that package's own
  // Footer.test.tsx for the equivalent "Raed palette, not a generic Tailwind
  // shade" regression guard. What's left compiled here is just the one piece
  // still theme-owned: the footer-menu item colors, which depend on the
  // `--stacked` / `--inline` modifier classes this theme's own Footer usage
  // adds, not something the shared component could style itself.
  it('darkens the footer menu items, not a generic Tailwind shade', async () => {
    const root = await compile('footer.scss');
    // The page footer only: the account-sheet copy (`--sheet`) is always light.
    const dark = 'body.footer-is-dark .store-footer:not(.store-footer--sheet)';

    const stacked = declarations(
      root,
      `${dark} .store-footer__menu--stacked .s-menu-footer-item`
    );
    expect(stacked.color).toContain('rgb(255 255 255');

    const inline = declarations(
      root,
      `${dark} .store-footer__menu--inline .s-menu-footer-item`
    );
    expect(inline.color).toContain('rgb(255 255 255');
    expect(inline['border-color']).toBe('rgb(255 255 255 / 0.1)');
  });
});

describe('topnav_is_dark (body.topnav-is-dark)', () => {
  it('darkens the header top bar like the Twig Raed .top-navbar', async () => {
    const root = await compile('header.scss');

    const topnav = declarations(root, 'body.topnav-is-dark .site-header__topnav');
    expect(topnav['background-color']).toContain('var(--lameem-deep)'); // solid deep green
    expect(topnav['border-color']).toBe('rgb(255 255 255 / 0.1)');
    expect(topnav.color).toContain('rgb(209 213 219'); // gray-300
  });
});

describe('header_is_dark (.site-header--dark)', () => {
  // `topnav_is_dark` now darkens the desktop top bar only. The main bar, in
  // both the lite and the default layout, is darkened by `header_is_dark`
  // (header-dark.scss), which replaced the old lite-only rule in header.scss.
  it('darkens the main bar with the deep green token and a thin white/10 border', async () => {
    const root = await compile('header-dark.scss');

    const bar = declarations(root, '.site-header--dark .site-header__bar');
    expect(bar['background-color']).toContain('var(--lameem-deep)');
    expect(bar['border-color']).toBe('rgb(255 255 255 / 0.1)');
  });

  it('shows the bar controls in white, with a translucent circle on hover', async () => {
    const root = await compile('header-dark.scss');
    const action = '.site-header--dark .site-header__bar .header-action';

    expect(declarations(root, action).color).toContain('rgb(255 255 255');
    expect(declarations(root, `${action}:hover`)).toHaveProperty('background-color');
  });

  it('shows the login icon in white, with no hover background of its own', async () => {
    const root = await compile('header-dark.scss');
    const login = '.site-header--dark .site-header__bar .s-user-menu-login-btn';

    expect(declarations(root, `${login} svg`).fill).toBe('#fff');
    expect(declarations(root, login).color).toContain('rgb(255 255 255');
    expect(declarations(root, `${login}:hover`)['background-color']).toBe('transparent');
  });
});

describe('dark mobile bottom bar', () => {
  it('is the deep green pill, with a white active tab and a brand-green icon', async () => {
    const root = await compile('mobile-bottom-bar.scss');

    expect(declarations(root, '.mobile-bottom-bar__inner')['background-color']).toContain(
      'var(--lameem-deep)'
    );
    const active = declarations(root, '.mobile-bottom-bar__item.is-active');
    expect(active['background-color']).toContain('rgb(255 255 255');
    expect(active.color).toBe('var(--lameem-primary)'); // not the merchant's --color-primary
  });
});
