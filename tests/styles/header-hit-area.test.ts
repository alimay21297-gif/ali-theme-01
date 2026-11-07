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

function rulesWith(root: Root, selector: string): Rule[] {
  const found: Rule[] = [];
  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) found.push(rule);
  });
  return found;
}

describe('header icon hit area', () => {
  it('is not painted on the web-component hosts, which would cover their inner link', async () => {
    const root = await compile('04-components/header.scss');
    // A bare `.header-action::after` would sit on <salla-cart-summary> / <salla-user-menu>.
    expect(rulesWith(root, '.header-action::after')).toHaveLength(0);
  });

  it('puts the 44px area on the real interactive element instead', async () => {
    const root = await compile('04-components/header.scss');
    const cases: [string, string][] = [
      ['button.header-action::after', '-2px'],
      ['a.header-action::after', '-2px'],
      ['.header-action .s-user-menu-login-btn::after', '-2px'],
      ['.header-action .s-user-menu-trigger::after', '-2px'],
      // The cart link is a positioned 24px icon: 24px + 10px each side = 44px.
      ['.header-action .s-cart-summary-wrapper::after', '-10px'],
    ];
    for (const [selector, inset] of cases) {
      const rules = rulesWith(root, selector);
      expect(rules, selector).toHaveLength(1);
      const props: Record<string, string> = {};
      rules[0].walkDecls((d) => {
        props[d.prop] = d.value;
      });
      expect(props.position).toBe('absolute');
      // 40px circle + 2px each side = 44px.
      expect(props.inset, selector).toBe(inset);
    }
  });
});
