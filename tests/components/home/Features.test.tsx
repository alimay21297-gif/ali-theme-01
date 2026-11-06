import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Features } from '../../../app/components/home/Features';

const item = (n: number) => ({ icon: 'sicon-star', title: `Title ${n}`, text: `Text ${n}` });
const items = (n: number) => Array.from({ length: n }, (_, i) => item(i + 1));

describe('Features', () => {
  it.each([2, 4, 6])('renders %i items', (n) => {
    const { container } = render(<Features data={{ items: items(n) }} />);
    expect(container.querySelectorAll('.home-features__item')).toHaveLength(n);
  });

  it('sets the column count from the item count, capped at 4', () => {
    const four = render(<Features data={{ items: items(4) }} />).container;
    expect((four.querySelector('ul') as HTMLElement).style.getPropertyValue('--features-cols')).toBe('4');
    const six = render(<Features data={{ items: items(6) }} />).container;
    expect((six.querySelector('ul') as HTMLElement).style.getPropertyValue('--features-cols')).toBe('4');
    const two = render(<Features data={{ items: items(2) }} />).container;
    expect((two.querySelector('ul') as HTMLElement).style.getPropertyValue('--features-cols')).toBe('2');
  });

  it('renders nothing with no items, bad data, or only untitled items', () => {
    expect(render(<Features data={{}} />).container.firstChild).toBeNull();
    expect(render(<Features data={{ items: [] }} />).container.firstChild).toBeNull();
    expect(render(<Features data={{ items: 'x' }} />).container.firstChild).toBeNull();
    expect(render(<Features data={{ items: [{ icon: 'sicon-star', title: ' ' }] }} />).container.firstChild).toBeNull();
  });

  it('reads the prefixed field ids and drops icons that are not sicon classes', () => {
    const { container } = render(
      <Features
        data={{
          items: [
            { 'items.icon': 'sicon-star', 'items.title': 'A', 'items.text': 'a' },
            { icon: 'x" onclick="y', title: 'B' },
          ],
        }}
      />
    );
    const tiles = container.querySelectorAll('.home-features__item');
    expect(tiles[0].querySelector('i.sicon-star')).not.toBeNull();
    expect(tiles[1].querySelector('i')).toBeNull();
    expect(tiles[1].querySelector('p')).toBeNull();
  });

  it('caps at 6 items', () => {
    const { container } = render(<Features data={{ items: items(9) }} />);
    expect(container.querySelectorAll('.home-features__item')).toHaveLength(6);
  });
});
