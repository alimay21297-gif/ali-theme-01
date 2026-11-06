/**
 * Clear every selected listing filter and return to the unfiltered list.
 *
 * The engine's own mechanism is `<salla-filters>.resetFilters()` (docs:
 * /web-components/salla-filters): it empties the selection, drops the
 * `filters[...]` query parameters and emits `salla-filters::changed` with an
 * empty object, which `useAppliedFilters` turns back into the loader's list.
 * It is called on every live `<salla-filters>` (the desktop column and the
 * mobile sheet can both be mounted) so no hidden copy keeps stale checkboxes.
 *
 * When none is mounted (filter column hidden, sheet closed) the same two
 * effects are done by hand: remove the `filters[...]` parameters and emit the
 * documented global `salla-filters::changed` event with `{}`.
 */

type FiltersElement = Element & { resetFilters?: () => Promise<void> };
type EventBus = { emit?: (name: string, ...args: unknown[]) => void };

/** The query string without its `filters[...]` parameters ('' or '?a=b'). */
export function searchWithoutFilters(search: string): string {
  const params = new URLSearchParams(search);
  for (const key of Array.from(params.keys())) {
    if (key.startsWith('filters[')) params.delete(key);
  }
  const rest = params.toString();
  return rest ? `?${rest}` : '';
}

export function clearListingFilters(): void {
  const live = Array.from(document.querySelectorAll<FiltersElement>('salla-filters')).filter(
    (el) => typeof el.resetFilters === 'function'
  );
  if (live.length > 0) {
    live.forEach((el) => void el.resetFilters?.());
    return;
  }

  const { pathname, search, hash } = window.location;
  window.history.pushState({}, '', `${pathname}${searchWithoutFilters(search)}${hash}`);
  (window.salla as { event?: EventBus } | undefined)?.event?.emit?.('salla-filters::changed', {});
}
