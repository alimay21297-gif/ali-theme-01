import { memo } from 'react';

export interface FeaturesProps {
  data: {
    /** Collection (twilight.json `items`): each entry is `{ icon, title, text }` (or `{ 'items.icon': … }`). */
    items?: unknown;
    position?: number;
    [key: string]: unknown;
  };
}

interface FeatureItem {
  icon: string;
  title: string;
  text: string;
}

/** Only Salla icon classes reach `className`; anything else renders a tile without an icon. */
const ICON_CLASS = /^sicon-[a-z0-9-]+$/;

const MAX_ITEMS = 6;

function field(item: Record<string, unknown>, name: string): string {
  const value = item[name] ?? item[`items.${name}`];
  return typeof value === 'string' ? value.trim() : '';
}

function parseItems(raw: unknown): FeatureItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({ icon: field(item, 'icon'), title: field(item, 'title'), text: field(item, 'text') }))
    .filter((item) => item.title)
    .slice(0, MAX_ITEMS);
}

/**
 * `features` home block (`s-block--features-strip`): a light strip of 2–6 short
 * selling points under the hero, each with an icon in a dark green circle, a title
 * and a short text. Plain text only (React escapes it). Items without a title are
 * dropped; no items renders nothing. The column count follows the item count
 * (`--features-cols`, see `home-features.scss`).
 */
export const Features = memo(function Features({ data }: FeaturesProps) {
  const items = parseItems(data.items);
  if (items.length === 0) return null;

  return (
    <div className="home-features">
      <ul
        className="container home-features__grid"
        style={{ '--features-cols': Math.min(items.length, 4) } as React.CSSProperties}
      >
        {items.map((item, i) => (
          <li key={`${i}:${item.title}`} className="home-features__item">
            <span className="home-features__icon" aria-hidden="true">
              {ICON_CLASS.test(item.icon) && <i className={item.icon} />}
            </span>
            <h3 className="home-features__title">{item.title}</h3>
            {item.text && <p className="home-features__text">{item.text}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
});
