import { memo } from 'react';
import { Image, Link } from '@salla.sa/twilight-theme-engine/common';
import { useCalligraphy } from '../../hooks/useCalligraphy';

export interface HeroProps {
  data: {
    title?: string;
    subtitle?: string;
    image?: string;
    btnname?: string;
    url?: string;
    position?: number;
    [key: string]: unknown;
  };
}

/** Widths the CDN resizes the product shot to; the displayed size is at most half the viewport. */
const IMAGE_WIDTHS = [480, 720, 960, 1200] as const;

/** Links the merchant may set: a path or an http(s) address. Anything else (`javascript:`) is dropped. */
function safeUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  const value = url.trim();
  if (!value) return undefined;
  return /^(\/|https?:\/\/|#)/i.test(value) ? value : undefined;
}

/**
 * `hero` home block (`s-block--hero`): the first screen of the home page. A dark
 * green surface with the calligraphy background (thinned behind the text column,
 * see `home-hero.scss`), a headline, a short text, one button and a product shot.
 *
 * Text goes on the inline-start side and the image on the other (mirrors in RTL);
 * on phones the text comes first, then the image. Every field is plain text; React
 * escapes it. It is the page's LCP, so the image loads eagerly at high priority and
 * sits in a fixed-ratio box (no layout shift). The page's `<h1>` is the store name
 * in the header, so the headline is an `<h2>`.
 *
 * Empty data: no title AND no image renders nothing; no button text or no link
 * renders no button.
 */
export const Hero = memo(function Hero({ data }: HeroProps) {
  const calligraphy = useCalligraphy();
  const title = data.title?.trim();
  const subtitle = data.subtitle?.trim();
  const btnname = data.btnname?.trim();
  const url = safeUrl(data.url);
  const image = data.image || undefined;

  if (!title && !image) return null;

  const hasText = Boolean(title || subtitle || (btnname && url));

  return (
    <div
      className={`home-hero bg-dark ${calligraphy.className}`.trim()}
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
        {image && (
          <div className="home-hero__media">
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
        )}
      </div>
    </div>
  );
});
