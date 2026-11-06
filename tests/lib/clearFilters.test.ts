import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearListingFilters, searchWithoutFilters } from '../../app/lib/clearFilters';

describe('searchWithoutFilters', () => {
  it('drops every filters[...] parameter and keeps the rest', () => {
    expect(
      searchWithoutFilters('?sort=bestSell&filters[price][from]=99999&filters[brand_id][]=1')
    ).toBe('?sort=bestSell');
  });

  it('returns an empty string when nothing else is left', () => {
    expect(searchWithoutFilters('?filters[price][from]=5')).toBe('');
    expect(searchWithoutFilters('')).toBe('');
  });
});

describe('clearListingFilters', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
    delete (window as { salla?: unknown }).salla;
  });

  it('calls resetFilters on every mounted <salla-filters>', () => {
    const desktop = document.createElement('salla-filters') as HTMLElement & {
      resetFilters: () => Promise<void>;
    };
    const mobile = document.createElement('salla-filters') as typeof desktop;
    desktop.resetFilters = vi.fn(async () => {});
    mobile.resetFilters = vi.fn(async () => {});
    document.body.append(desktop, mobile);

    clearListingFilters();

    expect(desktop.resetFilters).toHaveBeenCalledTimes(1);
    expect(mobile.resetFilters).toHaveBeenCalledTimes(1);
  });

  it('without a mounted component, cleans the URL and emits an empty selection', () => {
    const emit = vi.fn();
    (window as { salla?: unknown }).salla = { event: { emit } };
    window.history.replaceState({}, '', '/ar/-/c1?sort=bestSell&filters[price][from]=99999#top');

    clearListingFilters();

    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      '/ar/-/c1?sort=bestSell#top'
    );
    expect(emit).toHaveBeenCalledWith('salla-filters::changed', {});
  });

  it('does not throw when the SDK is missing', () => {
    window.history.replaceState({}, '', '/x?filters[a]=1');
    expect(() => clearListingFilters()).not.toThrow();
    expect(window.location.search).toBe('');
  });
});
