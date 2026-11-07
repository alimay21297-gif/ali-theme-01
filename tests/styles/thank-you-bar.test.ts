// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const styles = fileURLToPath(new URL('../../app/styles/04-components/', import.meta.url));
const thankYou = readFileSync(`${styles}thank-you.scss`, 'utf8');
const userPages = readFileSync(`${styles}user-pages.scss`, 'utf8');

describe('thank-you sticky bar', () => {
  it('uses a logical inset, never physical left/right', () => {
    expect(thankYou).toMatch(/inset-inline:\s*1rem/);
    expect(thankYou).not.toMatch(/(^|[\s;{])(left|right)\s*:/);
  });

  it('shares the product bar offset and the card-shadow token', () => {
    expect(thankYou).toContain('bottom: calc(76px + var(--safe-bottom))');
    expect(thankYou).toContain('box-shadow: var(--lameem-card-shadow)');
    expect(thankYou).not.toMatch(/rgba?\(/);
  });

  it('has no hard-coded hex colours', () => {
    expect(thankYou).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('no longer carries the dead .thankyou-block rules', () => {
    expect(userPages).not.toContain('thankyou-block');
  });
});
