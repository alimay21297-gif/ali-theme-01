import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { clearListingFilters } from '../../lib/clearFilters';
import { SearchIcon } from '../icons';
import { EmptyState } from '../common/EmptyState';

/**
 * Empty state of a product listing, on the shared `EmptyState` (heading, decorative
 * icon, one line and a button; styling in `04-components/empty-state.scss`).
 *
 *  - filters active, nothing matches: heading, hint, "Clear filters" button
 *  - no filters (an empty category): heading and a link to all products
 */
export function ListingEmpty({ hasFilters }: { hasFilters: boolean }) {
  const { t } = useTranslation();

  if (hasFilters) {
    return (
      <EmptyState
        icon={<SearchIcon />}
        title={t('blocks.catalog.empty_filtered_title', 'No products match these filters')}
        hint={t(
          'blocks.catalog.empty_filtered_hint',
          'Try changing the filters, or clear them to see every product.'
        )}
      >
        <button type="button" className="s-empty-state__action" onClick={clearListingFilters}>
          {t('blocks.catalog.clear_filters', 'Clear filters')}
        </button>
      </EmptyState>
    );
  }

  return (
    <EmptyState icon={<SearchIcon />} title={t('blocks.catalog.empty_title', 'No products here yet')}>
      <Link to="/products" className="s-empty-state__link">
        {t('blocks.catalog.all_products', 'View all products')}
      </Link>
    </EmptyState>
  );
}
