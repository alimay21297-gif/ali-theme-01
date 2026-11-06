import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { clearListingFilters } from '../../lib/clearFilters';
import { SearchIcon } from '../icons';

/**
 * Empty state of a product listing. It keeps the engine's `no-content-placeholder`
 * look (`no-content-placeholder.scss`), but the engine `NoContent` only takes an
 * icon font, one line and a link, so it cannot carry a heading, a decorative
 * icon or a button. Styling: `04-components/product-list.scss`.
 *
 *  - filters active, nothing matches: heading, hint, "Clear filters" button
 *  - no filters (an empty category): heading and a link to all products
 */
export function ListingEmpty({ hasFilters }: { hasFilters: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="no-content-placeholder s-listing-empty">
      <span className="s-listing-empty__icon" aria-hidden="true">
        <SearchIcon />
      </span>

      <h2 className="s-listing-empty__title">
        {hasFilters
          ? t('blocks.catalog.empty_filtered_title', 'No products match these filters')
          : t('blocks.catalog.empty_title', 'No products here yet')}
      </h2>

      {hasFilters ? (
        <>
          <p className="s-listing-empty__hint">
            {t(
              'blocks.catalog.empty_filtered_hint',
              'Try changing the filters, or clear them to see every product.'
            )}
          </p>
          <button type="button" className="s-listing-empty__action" onClick={clearListingFilters}>
            {t('blocks.catalog.clear_filters', 'Clear filters')}
          </button>
        </>
      ) : (
        <Link to="/products" className="s-listing-empty__link">
          {t('blocks.catalog.all_products', 'View all products')}
        </Link>
      )}
    </div>
  );
}
