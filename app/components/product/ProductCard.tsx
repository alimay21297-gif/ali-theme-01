import { useEffect, useMemo, useRef, type ComponentProps } from 'react';
import { ProductCard as EngineProductCard } from '@salla.sa/twilight-theme-engine/product';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { cardBadgeText } from '../../lib/cardBadge';
import { registerNativeBookingHook } from '../../lib/nativeBooking';
import { withImageFallback } from '../../lib/productImage';

type ProductCardProps = ComponentProps<typeof EngineProductCard>;

/**
 * Thin wrapper over the engine `ProductCard`.
 *
 * Site-wide by design: this wrapper (and the card styling in `product.scss`)
 * serves every card — listing, home sliders, Featured/Fixed/Latest blocks,
 * menus — so the badge text and look are the same everywhere (Salla review
 * requirement). Do not gate it to the listing page.
 *
 * After mount (and whenever the lazily-hydrated bits appear) it sets
 * `fill="solid"` and `loader-position="center"` on the add-to-cart button
 * (grid + list). The wishlist heart stays where the engine puts it: on the
 * image's corner for the vertical card (styled in `04-components/product.scss`),
 * in the footer row for the horizontal card.
 * A product with no photo shows the theme's placeholder, as the Twig card does
 * (the engine `Image` renders nothing without a `src`).
 * One badge per card: the engine shows `promotion_title`, so a sold-out product
 * or a discounted one without a merchant title gets that text there
 * (`lib/cardBadge.ts`). Its text direction (Arabic merchant text on an English
 * page) is handled in CSS with `unicode-bidi: plaintext`, not a `dir` attribute,
 * which would also flip the badge's `inset-inline-start` corner.
 * Inside the Salla app, a booking product's "Book now" fires `mobile::booking.open`
 * instead of opening the booking page (`lib/nativeBooking.ts`).
 * Styling: `04-components/product.scss`.
 */
export function ProductCard(props: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslation();
  const { product, isPlaceholder } = useMemo(() => {
    const withImage = withImageFallback(props.product);
    const badge = cardBadgeText(withImage.product, locale, t);
    return badge
      ? { ...withImage, product: { ...withImage.product, promotion_title: badge } }
      : withImage;
  }, [props.product, locale, t]);

  useEffect(() => {
    registerNativeBookingHook();
    const root = ref.current;
    if (!root) return;

    const sync = () => {
      root.querySelectorAll<HTMLElement>('salla-add-product-button').forEach((el) => {
        // engine ships the card button fill="outline"; make it solid + centre its spinner
        el.setAttribute('fill', 'solid');
        el.setAttribute('loader-position', 'center');
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ display: 'contents' }}
      data-image-placeholder={isPlaceholder ? 'true' : undefined}
    >
      <EngineProductCard {...props} product={product} />
    </div>
  );
}
