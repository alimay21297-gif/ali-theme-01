import { Fragment, useRef, useState, type MouseEvent } from 'react';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { HookName } from '@salla.sa/twilight-theme-engine/types/hooks';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getActiveCurrency } from '@salla.sa/twilight-theme-engine/api/client';
import { useWishlist } from '@salla.sa/twilight-theme-engine/hooks/useWishlist';
import { CurrencySymbol, Link, Image } from '@salla.sa/twilight-theme-engine/common';
import { formatSallaPlural } from '@salla.sa/twilight-theme-engine/utils';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { SallaRatingStars } from '@salla.sa/twilight-components-react/rating-stars';
import { SallaSocialShare } from '@salla.sa/twilight-components-react/social-share';
import { SallaInstallment } from '@salla.sa/twilight-components-react/installment';
import { useHydrated } from '../../hooks/useHydrated';
import { useMobileViewport } from '../../hooks/useMobileViewport';
import { youtubeFacades } from '../../lib/descriptionVideos';
import { sanitizeRichHtml } from '../../lib/sanitizeHtml';
import { ProductMetadata } from './ProductMetadata';
import { WishlistHeartButton } from './WishlistHeartButton';

interface ProductDetailsProps {
  product: Product;
  /** Live SKU of the selected variant; defaults to `product.sku`. */
  sku?: string | null;
  /** Live barcode of the selected variant; defaults to `product.barcode`. */
  barcode?: string | null;
  showTags?: boolean;
}

/**
 * Theme fork of the engine `ProductDetails`.
 *
 * Differs from the engine version: the data-column blocks (title, SKU row,
 * availability, sold / remaining quantity) render flat: no `bg-white`, no
 * `rounded`, no card padding. The `.product-form` `gap` / element `mb`
 * classes control the vertical rhythm. The brand logo passes `objectFit="contain"`
 * to `<Image>` rather than an `object-contain` class, which the component's own
 * `object-cover` default overrides. Upgrade notes: `FORKS.md`.
 */
export function ProductDetails({
  product,
  sku = product.sku,
  barcode = product.barcode,
  showTags = true,
}: ProductDetailsProps) {
  const { t } = useTranslation();
  const hydrated = useHydrated();
  const isMobile = useMobileViewport();

  // Context for all product hooks - contains product data
  const productHookContext = { product };

  return (
    <>
      <HookSlot name={HookName.PRODUCT_DESCRIPTION_START} context={productHookContext} />

      {product.brand?.name && (
        <div className="product-brand mb-5 w-12">
          <Link className="brand-logo" to={product.brand.url || '#'} title={product.brand.name}>
            <Image
              className="max-h-full"
              objectFit="contain"
              src={product.brand.logo}
              title={product.brand.name}
              alt={product.brand.name}
              aspectRatio="1/1"
            />
          </Link>
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          {/* 24px on phones, 32px from 768px; Readex Pro comes from `03-elements/headings.scss` */}
          <h1 className="text-2xl md:text-[2rem] leading-snug font-bold text-[color:var(--lameem-ink)]">
            {product.name}
          </h1>
          {product.subtitle && (
            <h2 className="product-entry__sub-title text-sm text-gray-600 leading-6 font-normal">
              {product.subtitle}
            </h2>
          )}
        </div>

        {/* share + wishlist, pulled up beside the title on the end side.
            On mobile these move to the gallery overlay bar (`ProductGallery`),
            so this copy is hidden — see `product.scss`. */}
        <div className="product-details__title-actions flex shrink-0">
          <SallaSocialShare className="inline-flex" aria-label={t('pages.products.social_share', 'Share this product')} />

          <TitleWishlistButton productId={Number(product.id)} />
        </div>
      </div>

      {product.rating && (
        <div className="product-details__rating mb-3">
          <SallaRatingStars value={product.rating.stars} reviews={product.rating.count} />
        </div>
      )}

      <div className="mb-4">
        <ProductPrice product={product} />
        {product.is_taxable && (
          <small className="block mt-1 text-xs text-gray-600">{t('pages.products.tax_included')}</small>
        )}
      </div>

      <ProductDescription product={product} />

      {/* Metadata / specs — mobile only. On `md`+ it renders under the gallery
          slider instead (`ProductGallery`) — same hydration-gated mounting
          there, so together the two never run two `<SallaMetadata>` instances
          at once past first paint; see the comment on that copy. */}
      {product.has_metadata && (!hydrated || isMobile) && (
        <ProductMetadata className="mb-3 md:hidden order-2" />
      )}

      {!!product.tags?.length && showTags && (
        <div className="mb-3">
          {product.tags.map((tag, index, tags) => (
            <Fragment key={tag.name}>
              <Link
                to={tag.url}
                className="me-2 inline-flex text-gray-600 hover:text-primary underline text-sm mb-1"
              >
                {tag.name}
              </Link>
              {index < tags.length - 1 && ','}
            </Fragment>
          ))}
        </div>
      )}

      <ProductQuantityInfo product={product} />

      {sku && (
        <div className="mb-4 flex justify-between sm:grid sm:grid-cols-3">
          <div className="flex items-center">
            <i className="sicon-barcode mx-1"></i>
            {t('pages.products.sku')}
          </div>
          <div className="text-unicode">{sku}</div>
        </div>
      )}

      {barcode && (
        <div className="mb-4 flex justify-between sm:grid sm:grid-cols-3">
          <div className="flex items-center">
            <i className="sicon-barcode mx-1"></i>
            {t('pages.products.barcode')}
          </div>
          <div className="text-unicode">{barcode}</div>
        </div>
      )}

      {product.show_availability && (
        <section className="mb-4 last:mb-0">
          <div className="center-between">
            <span className="flex items-center text-base">
              <span className="sicon-location me-1"></span>
              <span className="inline-block">{t('pages.products.availability')}</span>
            </span>
            <div className="mt-1 sm:mt-0 sm:col-span-2 text-end">
              <div className="flex rtl:space-x-reverse space-x-3">
                {/* A button, not `href="#!"`: it opens the branch picker and leaves the URL
                    and history alone. `with-arrow` turns the arrow to the right in LTR (`ltr.scss`). */}
                <button
                  type="button"
                  onClick={() =>
                    window.salla?.event?.dispatch('scopes::open', {
                      mode: 'availability',
                      product_id: String(product.id),
                    })
                  }
                  className="group with-arrow text-primary flex items-center justify-center"
                >
                  <span>{t('pages.products.select_branch')}</span>
                  <span className="sicon-keyboard_arrow_left ms-2 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1"></span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <HookSlot name={HookName.PRODUCT_DESCRIPTION} context={productHookContext} />

      <SallaInstallment
        price={String(
          typeof product.base_currency_price === 'object'
            ? product.base_currency_price.amount
            : product.base_currency_price
        )}
      />
    </>
  );
}

function TitleWishlistButton({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const wishlist = useWishlist();

  return (
    <WishlistHeartButton
      productId={productId}
      pressed={wishlist.has(productId)}
      className={`btn--wishlist animated hidden sm:inline-flex ${wishlist.has(productId) ? 'is-added' : 'not-added'}`}
      onClick={() => window.salla?.wishlist.toggle(productId)}
      ariaLabel={t('pages.products.add_to_wishlist', 'Add to wishlist')}
    />
  );
}

function ProductPrice({ product }: { product: Product }) {
  const { t } = useTranslation();
  // The API converts the amounts but still labels them in the store's own currency.
  const priceCurrency = getActiveCurrency(product.currency);

  return (
    <div className="flex whitespace-nowrap gap-4 items-baseline">
      <div
        className={`${product.is_on_sale ? '' : 'hidden'} space-x-3 rtl:space-x-reverse whitespace-nowrap`}
      >
        <p className="text-[color:var(--lameem-sale)] font-bold text-2xl md:text-3xl inline-block">
          {product.sale_price} <CurrencySymbol currency={priceCurrency} />
        </p>
        <span className="text-gray-600 text-base line-through">
          {product.regular_price} <CurrencySymbol currency={priceCurrency} />
        </span>
      </div>
      <div className={`gap-4 items-baseline ${product.is_on_sale ? 'hidden' : 'flex'}`}>
        {product.starting_price && (
          <span className="text-sm text-gray-600">{t('pages.products.starting_price')}</span>
        )}
        <p className="font-bold text-2xl md:text-3xl text-[color:var(--lameem-ink)] inline-block">
          {product.starting_price ?? product.price} <CurrencySymbol currency={priceCurrency} />
        </p>
      </div>
    </div>
  );
}

function ProductDescription({ product }: { product: Product }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  // YouTube videos the shopper pressed play on; the rest stay thumbnails.
  const [playingVideos, setPlayingVideos] = useState<ReadonlySet<number>>(() => new Set());

  if (!product.description) return null;

  // Merchant HTML: sanitise first (allow-list; it also forces lazy iframes), then YouTube thumbnails.
  // `&nbsp;` is swapped before parsing, because the sanitiser would decode it to a raw U+00A0.
  const description = youtubeFacades(
    sanitizeRichHtml(product.description.replace(/&nbsp;/g, '\n')),
    playingVideos,
    t('pages.products.play_video', 'Play video')
  );

  // One listener for every thumbnail in the merchant's HTML.
  const playVideo = (event: MouseEvent<HTMLElement>) => {
    const facade = (event.target as Element).closest?.('[data-video-index]');
    if (!facade) return;
    const index = Number(facade.getAttribute('data-video-index'));
    setPlayingVideos((current) => new Set(current).add(index));
  };

  if (product.has_read_more) {
    return (
      <div className="product__description leading-7 mb-4">
        <article
          ref={articleRef}
          className="article article--main relative leading-8 overflow-hidden transition-[max-height] duration-300 py-4 focus:outline-none"
          id="more-content"
          tabIndex={-1}
          style={{ maxHeight: isExpanded ? 'none' : '5.25rem' }}
          onClick={playVideo}
          dangerouslySetInnerHTML={{ __html: description }}
        />
        {/* Fades out once used, so it is also `inert`; focus moves to the text it revealed
            rather than dropping to the top of the page. */}
        <button
          type="button"
          id="btn-show-more"
          aria-expanded={isExpanded}
          aria-controls="more-content"
          inert={isExpanded}
          className={`link--primary inline-block mt-2 cursor-pointer bg-transparent border-0 p-0 ${isExpanded ? 'is-expanded' : ''}`}
          onClick={() => {
            setIsExpanded(true);
            articleRef.current?.focus({ preventScroll: true });
          }}
        >
          {t('pages.products.read_more')}
        </button>
      </div>
    );
  }

  return (
    <div className="product__description leading-7 mb-4">
      <article
        className="article--main pb-1"
        onClick={playVideo}
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}

/** Sold count in the sale red; the low-stock line is a notice, not a price, so it is amber-800 (7:1 on white). */
function ProductQuantityInfo({ product }: { product: Product }) {
  const { t } = useTranslation();
  // Like Twig's `{% if product.sold_quantity or product.can_show_remained_quantity %}`:
  // a product that sold 0 has nothing to show either, and the `mb-5` box would be an empty gap.
  if (!((product.sold_quantity ?? 0) > 0) && !product.can_show_remained_quantity) {
    return null;
  }

  return (
    <div className="mb-4 inline-flex text-sm">
      {(product.sold_quantity ?? 0) > 0 && (
        <div className="px-4 only:px-0 !text-[color:var(--lameem-sale)]">
          <i className="sicon-fire me-1.5"></i> {t('pages.products.sold')}{' '}
          {/* Salla ships `sold_times` in Laravel plural format; resolve it for the count. */}
          <span>{formatSallaPlural(t('pages.products.sold_times'), product.sold_quantity!)}</span>
        </div>
      )}
      {product.can_show_remained_quantity &&
        ((product.quantity ?? 0) > 0 ? (
          <div className="inline-flex items-center gap-2 px-4 only:px-1 font-medium text-green-700">
            {/* live "in stock" dot with pulsing waves */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75 motion-reduce:hidden" />
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-40 motion-reduce:hidden"
                style={{ animationDelay: '0.75s' }}
              />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600" />
            </span>
            {t('blocks.product.in_stock')} ({product.quantity})
          </div>
        ) : (
          <div className="px-4 only:px-1 !text-amber-800">
            <i className="sicon-box-bankers me-1.5"></i>
            {t('pages.products.remained')} <span>{product.quantity ?? 0}</span>
          </div>
        ))}
    </div>
  );
}
