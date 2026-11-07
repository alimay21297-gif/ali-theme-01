import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ListingEmpty } from '../../../app/components/product/ListingEmpty';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe('ListingEmpty', () => {
  it('with filters active: heading, hint and a Clear filters button, no link', () => {
    render(<ListingEmpty hasFilters />);
    expect(screen.getByRole('heading', { name: 'No products match these filters' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('Clear filters resets the mounted <salla-filters>', () => {
    const el = document.createElement('salla-filters') as HTMLElement & {
      resetFilters: () => Promise<void>;
    };
    el.resetFilters = vi.fn(async () => {});
    document.body.append(el);

    render(<ListingEmpty hasFilters />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(el.resetFilters).toHaveBeenCalledTimes(1);
    el.remove();
  });

  it('with no filters: heading and a link to all products, no button', () => {
    render(<ListingEmpty hasFilters={false} />);
    expect(screen.getByRole('heading', { name: 'No products here yet' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link', { name: 'View all products' }).getAttribute('href')).toBe(
      '/products'
    );
  });

  it('hides the decorative icon from assistive tech', () => {
    const { container } = render(<ListingEmpty hasFilters />);
    expect(container.querySelector('.s-empty-state__icon')?.getAttribute('aria-hidden')).toBe(
      'true'
    );
  });
});
