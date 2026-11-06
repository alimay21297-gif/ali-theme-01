import { memo } from 'react';
import { Image, Link } from '@salla.sa/twilight-theme-engine/common';
import { useCalligraphy } from '../../hooks/useCalligraphy';
import { parseShowcase } from '../../lib/heroShowcase';
import { safeUrl } from '../../lib/safeUrl';
import { ProductShowcase } from './ProductShowcase';

export interface HeroProps {
  data: {
    title?: string;
    subtitle?: string;
    image?: string;
    btnname?: string;
    url?: string;
    /** Animated products (twilight.json `animate_products`, `p1_*`, `p2_*`): see `lib/heroShowcase.ts`. */
    animate_products?: boolean;
    position?: number;
    [key: string]: unknown;
  };
}

/** Widths the CDN resizes the product shot to; the displayed size is at most half the viewport. */
const IMAGE_WIDTHS = [480, 720, 960, 1200] as const;

/**
 * Radar rings behind the product shot: five thin concentric circles and one slow
 * outward "signal" pulse (animated in `home-hero.scss`, off for reduced motion).
 * Inline SVG, so no `url()` reaches the critical CSS. Decorative.
 */
const RING_RADII = [22, 40, 58, 76, 94] as const;

function Radar() {
  return (
    <svg className="home-hero__radar" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      {RING_RADII.map((r) => (
        <circle key={r} cx="0" cy="0" r={r} />
      ))}
      <circle className="home-hero__pulse" cx="0" cy="0" r={RING_RADII[0]} />
    </svg>
  );
}

/**
 * `hero` home block (`s-block--hero`): the first screen of the home page. A dark
 * green surface with a radial glow behind the product, radar rings and the
 * calligraphy background (thinned behind the text column and toward the edges, see
 * `home-hero.scss`), a headline, a short text, one button and a product shot.
 *
 * Text goes on the inline-start side and the image on the other (mirrors in RTL);
 * on phones the text comes first, then the image. Every field is plain text; React
 * escapes it. It is the page's LCP, so the image loads eagerly at high priority and
 * sits in a fixed-ratio box (no layout shift). The page's `<h1>` is the store name
 * in the header, so the headline is an `<h2>`.
 *
 * With `animate_products` on and the products complete, the single image gives way
 * to the layered, animated products ({@link ProductShowcase}); otherwise the single
 * image is the fallback.
 *
 * Empty data: no title AND no image AND no products renders nothing; no button text
 * or no link renders no button.
 */
export const Hero = memo(function Hero({ data }: HeroProps) {
  const calligraphy = useCalligraphy();
  const title = data.title?.trim();
  const subtitle = data.subtitle?.trim();
  const btnname = data.btnname?.trim();
  const url = safeUrl(data.url);
  const image = data.image || undefined;
  const showcase = parseShowcase(data);

  if (!title && !image && showcase.length === 0) return null;

  const hasText = Boolean(title || subtitle || (btnname && url));

  return (
    <div
      className={`home-hero ${calligraphy.className}`.trim()}
      style={calligraphy.style}
    >
      <div className={`container home-hero__inner${hasText ? '' : ' home-hero__inner--image-only'}`}>
        {hasText && (
          <div className="home-hero__text">
            {title && <h2 className="home-hero__title">{title}</h2>}
            {subtitle && <p className="home-hero__subtitle">{subtitle}</p>}
            {btnname && url && (
              <Link to={url} className="home-hero__cta">
                {btnname}
              </Link>
            )}
          </div>
        )}
        {showcase.length > 0 ? (
          <div className="home-hero__media home-hero__media--showcase">
            <Radar />
            <ProductShowcase products={showcase} />
          </div>
        ) : image ? (
          <div className="home-hero__media">
            <Radar />
            <Image
              src={image}
              alt={title || ''}
              priority
              width={960}
              height={960}
              objectFit="contain"
              srcSetWidths={IMAGE_WIDTHS}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="home-hero__image"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});
