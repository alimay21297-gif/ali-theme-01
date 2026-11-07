import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { ShoppingBagIcon } from '../icons';
import { EmptyState } from '../common/EmptyState';

/** The cart has no lines (or no cart at all): a heading, one line and a way to the shop. */
export function CartEmpty() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={<ShoppingBagIcon />}
      title={t('blocks.cart.empty_title', 'Your cart is empty')}
      hint={t('blocks.cart.empty_hint', 'Start shopping and add your favourite products.')}
    >
      <Link to="/products" className="s-empty-state__action">
        {t('blocks.cart.browse_products', 'Browse products')}
      </Link>
    </EmptyState>
  );
}
