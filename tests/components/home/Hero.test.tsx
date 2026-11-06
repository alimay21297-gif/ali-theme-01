import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Hero } from '../../../app/components/home/Hero';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: unknown; className?: string }) => (
    <a href={to} className={className}>
      {children as never}
    </a>
  ),
  Image: (props: Record<string, unknown>) => (
    <img alt={String(props.alt ?? '')} src={String(props.src ?? '')} />
  ),
}));

vi.mock('../../../app/hooks/useCalligraphy', () => ({
  useCalligraphy: () => ({ className: 'has-calligraphy', style: undefined }),
}));

describe('Hero', () => {
  it('renders nothing with no title and no image', () => {
    const { container } = render(<Hero data={{ subtitle: 'x', btnname: 'Go', url: '/' }} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the title as a plain-text h2 with the calligraphy class', () => {
    const { container } = render(<Hero data={{ title: '<b>Hello</b>' }} />);
    const h2 = container.querySelector('h2');
    expect(h2?.textContent).toBe('<b>Hello</b>');
    expect(h2?.querySelector('b')).toBeNull();
    expect(container.querySelector('.home-hero')?.className).toContain('has-calligraphy');
  });

  it('shows the button only with both text and a link', () => {
    const both = render(<Hero data={{ title: 'T', btnname: 'Shop', url: '/products' }} />);
    expect(both.container.querySelector('a')?.getAttribute('href')).toBe('/products');
    both.unmount();

    expect(render(<Hero data={{ title: 'T', btnname: 'Shop' }} />).container.querySelector('a')).toBeNull();
    expect(render(<Hero data={{ title: 'T', url: '/x' }} />).container.querySelector('a')).toBeNull();
  });

  it('drops a link that is not a path or an http(s) address', () => {
    const { container } = render(
      <Hero data={{ title: 'T', btnname: 'Shop', url: 'javascript:alert(1)' }} />
    );
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders an image-only hero without a text column', () => {
    const { container } = render(<Hero data={{ image: 'https://cdn.example/p.png' }} />);
    expect(container.querySelector('.home-hero__text')).toBeNull();
    expect(container.querySelector('img')).not.toBeNull();
  });
});
