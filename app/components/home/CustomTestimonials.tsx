import { memo } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { TestimonialsCarousel, type TestimonialItem } from '../common';
import { safeUrl } from '../../lib/safeUrl';

export interface CustomTestimonialsProps {
  data: {
    /** Collection (twilight.json `items`): each entry is `{ name, … }` (or `{ 'items.name': … }`). */
    items?: unknown;
    title?: string;
    description?: string;
    /** Switch: the link to the real /testimonials page. On unless the merchant turns it off. */
    show_all_link?: boolean;
    position?: number;
    [key: string]: unknown;
  };
}

const MAX_ITEMS = 30;

function text(item: Record<string, unknown>, name: string): string | undefined {
  const value = item[name] ?? item[`items.${name}`];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseItems(raw: unknown): TestimonialItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      // Defence in depth (the field is an image picker): an unsafe value counts as
      // missing, so the first-letter circle shows.
      avatar: safeUrl(text(item, 'avatar')),
      name: text(item, 'name'),
      city: text(item, 'city'),
      product: text(item, 'product'),
      text: text(item, 'text'),
      stars: Number(item.stars ?? item['items.stars'] ?? 0),
    }))
    .filter((item) => item.text)
    .slice(0, MAX_ITEMS);
}

/**
 * `custom-testimonials` home block — reviews the merchant typed in, as white cards
 * on a light band (see `TestimonialsCarousel`). Genuine customer reviews only:
 * nothing is shipped as a default, and with no usable item the block renders
 * nothing. Optional per review: avatar, city, purchased product.
 */
export const CustomTestimonials = memo(function CustomTestimonials({
  data,
}: CustomTestimonialsProps) {
  const { t } = useTranslation();
  const items = parseItems(data.items);

  if (!items.length) return null;

  return (
    <TestimonialsCarousel
      items={items}
      title={data.title || t('blocks.home.testimonials', 'Customer reviews')}
      description={data.description}
      showAllLink={data.show_all_link !== false}
    />
  );
});
