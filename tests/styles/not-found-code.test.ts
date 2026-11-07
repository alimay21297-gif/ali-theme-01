// @vitest-environment node
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type Rule } from 'postcss';
import tailwindcss from 'tailwindcss';

const themeRoot = fileURLToPath(new URL('../../', import.meta.url));
const tailwindConfig = createRequire(import.meta.url)(`${themeRoot}tailwind.config.cjs`);

async function rulesFor(file: string, match: (rule: Rule) => boolean): Promise<Rule[]> {
  const { css } = sass.compile(`${themeRoot}app/styles/${file}`);
  const root = (
    await postcss([tailwindcss({ ...tailwindConfig, content: [{ raw: '' }] })]).process(css, {
      from: undefined,
    })
  ).root;
  const found: Rule[] = [];
  root.walkRules((rule) => {
    if (match(rule)) found.push(rule);
  });
  return found;
}

describe("the engine's 404 code", () => {
  it('is recoloured above the engine text-gray-300, without !important', async () => {
    // Sass may drop the attribute value's quotes, so match on the value alone.
    const rules = await rulesFor('04-components/empty-state.scss', (rule) =>
      rule.selectors.some((sel) => sel.includes('data-testid') && sel.includes('error-code'))
    );

    expect(rules).toHaveLength(1);
    let color: string | undefined;
    let important = false;
    rules[0].walkDecls('color', (d) => {
      color = d.value;
      important = important || d.important === true;
    });
    expect(color).toBeDefined();
    // gray-300 is rgb(209 213 219): the 404 must no longer use it.
    expect(color).not.toContain('209 213 219');
    expect(important).toBe(false);
    // `.container > h1[...]`: two classes-or-attributes beat the engine's one utility class.
    expect(rules[0].selector).toMatch(/^\.container\s*>\s*h1\[/);
  });
});
