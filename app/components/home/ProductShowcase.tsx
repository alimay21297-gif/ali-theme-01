import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Image, Link } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';

/** How a product's layers move when it opens. */
export type ShowcaseAnimation = 'slide' | 'swing';

export interface ShowcaseProduct {
  type: ShowcaseAnimation;
  /** The product page. The whole product is one link to it. */
  url: string;
  /** Names the link for screen readers. */
  name?: string;
  /** The front layer. Same canvas as every layer of the product; loads eagerly (LCP). */
  body: string;
  /**
   * The layers behind the body, closed position. `slide`: nearest card first, the
   * last one travels furthest. `swing`: inner blade first, outer blade last.
   */
  layers: string[];
  /** `swing` only: where the blades pivot, in % of the canvas. */
  pivotX?: number;
  pivotY?: number;
}

/**
 * Each product's layers share one canvas, so they stack at 0,0 with no offsets.
 * The size is fixed per animation type (the layers are cut to it); it reserves
 * the box before the images load, so nothing shifts.
 */
const CANVAS: Record<ShowcaseAnimation, { w: number; h: number }> = {
  slide: { w: 520, h: 900 },
  swing: { w: 600, h: 900 },
};

/**
 * Space between two products, as a share of the canvas height. Kept small so the
 * products sit close when closed. The open cards reach ~0.15 past the wallet canvas,
 * into the key organizer canvas's empty left margin (its body starts ~0.14 in), so
 * they pass through this gap and stop short of the key organizer's body.
 */
const GAP = 0.07;
/** Default blade pivot: 53% / 71.1% of the key organizer canvas. */
const DEFAULT_PIVOT = { x: 53, y: 71.1 } as const;

/** Slide: the back card travels 45% of the canvas width; each nearer card ~14.5% less (16 / 31 / 45). */
const SLIDE_BACK = 45;
const SLIDE_STEP = 14.5;
const SLIDE_STAGGER_MS = 80;

/** Swing: closed blades are turned back by 30° (inner) and 55° (outer); open they are at 0° and 6°. */
const SWING_CLOSED_START = -30;
const SWING_CLOSED_STEP = -25;
const SWING_OPEN_STEP = 6;

const OPEN_AFTER_MS = 600;

/** Whether the visitor asked for reduced motion; `false` before hydration (CSS covers that gap). */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(Boolean(query?.matches));
    sync();
    query?.addEventListener?.('change', sync);
    return () => query?.removeEventListener?.('change', sync);
  }, []);
  return reduced;
}

/** Style of one layer behind the body: its own closed/open transform and delay. */
function layerStyle(type: ShowcaseAnimation, index: number, count: number): CSSProperties {
  const fromBack = count - 1 - index;
  if (type === 'slide') {
    return {
      zIndex: 4 - index,
      '--open-x': `${SLIDE_BACK - fromBack * SLIDE_STEP}%`,
      '--delay': `${50 + fromBack * SLIDE_STAGGER_MS}ms`,
    } as CSSProperties;
  }
  return {
    zIndex: 2 + index,
    '--closed-rotate': `${SWING_CLOSED_START + index * SWING_CLOSED_STEP}deg`,
    '--open-rotate': `${index * SWING_OPEN_STEP}deg`,
    '--delay': `${50 + fromBack * 170}ms`,
  } as CSSProperties;
}

const ShowcaseItem = memo(function ShowcaseItem({
  product,
  column,
  reducedMotion,
}: {
  product: ShowcaseProduct;
  /** Grid column (1-based): products sit in the odd columns, the even ones are gaps. */
  column: number;
  reducedMotion: boolean;
}) {
  const { t } = useTranslation();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);
  const { w, h } = CANVAS[product.type];
  const pivot = {
    x: product.pivotX ?? DEFAULT_PIVOT.x,
    y: product.pivotY ?? DEFAULT_PIVOT.y,
  };

  // No hover on touch screens: open once, shortly after the product is in view
  // (the hero is on screen at load). Desktop opens on hover and focus, in CSS.
  useEffect(() => {
    const el = linkRef.current;
    if (reducedMotion || !el) return;
    if (!window.matchMedia?.('(hover: none)').matches || !('IntersectionObserver' in window)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        timer = setTimeout(() => setOpen(true), OPEN_AFTER_MS);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [reducedMotion]);

  const classes = [
    'product-showcase__item',
    `product-showcase__item--${product.type}`,
    open ? 'is-open' : '',
    reducedMotion ? 'is-static' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link
      ref={linkRef}
      to={product.url}
      className={classes}
      aria-label={product.name || t('blocks.home.view_product', 'View product')}
      style={
        {
          aspectRatio: `${w} / ${h}`,
          gridColumn: column,
          '--pivot-x': `${pivot.x}%`,
          '--pivot-y': `${pivot.y}%`,
        } as CSSProperties
      }
    >
      <span className="product-showcase__stage">
        {product.layers.map((src, index) => (
          <Image
            key={`${src}:${index}`}
            src={src}
            alt=""
            width={w}
            height={h}
            objectFit="contain"
            className="product-showcase__layer"
            style={layerStyle(product.type, index, product.layers.length)}
          />
        ))}
        <Image
          src={product.body}
          alt=""
          priority
          width={w}
          height={h}
          objectFit="contain"
          className="product-showcase__body"
        />
      </span>
      <span className="product-showcase__shadow" aria-hidden="true" />
    </Link>
  );
});

/**
 * Layered, animated products. Each product is one link to its product page and
 * is made of images stacked on one canvas: the `body` in front and the `layers`
 * behind it, closed. Opening moves the layers:
 *
 *  - `slide`: the cards translate straight to the physical RIGHT, as a staircase
 *    (back card furthest), 80ms apart.
 *  - `swing`: the blades turn out from behind the body around the pivot, with a
 *    slight spring.
 *
 * The whole product also tilts a little in 3D. Desktop opens on hover and focus;
 * touch screens open once, 600ms after it is in view; with reduced motion the
 * product shows open and nothing moves. The art never mirrors in RTL (the row is
 * `dir=ltr`), so "right" is right in both languages.
 *
 * Styles: `04-components/product-showcase.scss`. Used by the hero; the future
 * standalone block reuses it.
 */
export const ProductShowcase = memo(function ProductShowcase({
  products,
}: {
  products: ShowcaseProduct[];
}) {
  const reducedMotion = useReducedMotion();
  if (!products.length) return null;

  // Columns share the width in proportion to each canvas's aspect ratio, so every
  // product ends up the same height; the gap column makes room for the cards.
  const columns = products
    .map(({ type }) => `minmax(0, ${Math.round((CANVAS[type].w / CANVAS[type].h) * 1000)}fr)`)
    .join(` minmax(0, ${GAP * 1000}fr) `);
  const ratio =
    products.reduce((sum, { type }) => sum + CANVAS[type].w / CANVAS[type].h, 0) +
    GAP * (products.length - 1);

  return (
    <div
      className="product-showcase"
      dir="ltr"
      style={{ gridTemplateColumns: columns, '--showcase-ratio': ratio } as CSSProperties}
    >
      {products.map((product, index) => (
        <ShowcaseItem
          key={`${product.url}:${index}`}
          product={product}
          column={index * 2 + 1}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
});
