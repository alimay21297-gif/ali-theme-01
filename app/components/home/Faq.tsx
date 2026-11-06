import { memo, useId } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { linkUrl } from '../../lib/safeUrl';

export interface FaqProps {
  data: {
    title?: string;
    subtitle?: string;
    /** Collection (twilight.json `items`): each entry is `{ question, answer }` (or `{ 'items.question': … }`). */
    items?: unknown;
    guarantee_title?: string;
    guarantee_text?: string;
    guarantee_icon?: string;
    guarantee_button?: string;
    guarantee_link?: unknown;
    [key: string]: unknown;
  };
}

interface FaqItem {
  question: string;
  answer: string;
}

/** Only Salla icon classes reach `className`; anything else renders the card without an icon. */
const ICON_CLASS = /^sicon-[a-z0-9-]+$/;

const MAX_ITEMS = 12;

function field(item: Record<string, unknown>, name: string): string {
  const value = item[name] ?? item[`items.${name}`];
  return typeof value === 'string' ? value.trim() : '';
}

/** Items need both a question and an answer; the rest are dropped. */
export function parseFaqItems(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({ question: field(item, 'question'), answer: field(item, 'answer') }))
    .filter((item) => item.question && item.answer)
    .slice(0, MAX_ITEMS);
}

/** Characters written as \u escapes in the JSON-LD (built with char codes: the two separators end a line in JS source). */
const UNSAFE_IN_SCRIPT = new RegExp(`[<>&${String.fromCharCode(0x2028, 0x2029)}]`, 'g');

/**
 * FAQPage structured data as a string that is safe inside a `<script>`: built with
 * JSON.stringify, then `<`, `>`, `&` and the two JS line separators are written as
 * \u escapes so nothing in a question or answer can close the tag or start markup.
 */
export function faqJsonLd(items: FaqItem[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }).replace(UNSAFE_IN_SCRIPT, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

/**
 * `faq` home block (`s-block--faq`): a white section with an accordion of 1–12
 * questions (native <details>/<summary>, one open at a time through the shared `name`
 * where the browser supports it) and an optional dark guarantee card beside it
 * (below it on phones). Plain text only; React escapes it. No valid items = no FAQ
 * part and no JSON-LD; no guarantee text = full-width FAQ; neither = nothing.
 */
export const Faq = memo(function Faq({ data }: FaqProps) {
  const group = useId();
  const items = parseFaqItems(data.items);

  const guaranteeTitle = data.guarantee_title?.trim();
  const guaranteeText = data.guarantee_text?.trim();
  const guaranteeIcon = data.guarantee_icon?.trim() ?? '';
  const buttonLabel = data.guarantee_button?.trim();
  const url = linkUrl(data.guarantee_link);
  const hasCard = Boolean(guaranteeTitle || guaranteeText);

  if (items.length === 0 && !hasCard) return null;

  const title = data.title?.trim();
  const subtitle = data.subtitle?.trim();
  const layout = items.length > 0 && hasCard ? ' home-faq__layout--split' : '';

  return (
    <div className="home-faq">
      <div className={`container home-faq__layout${layout}`}>
        {items.length > 0 && (
          <div className="home-faq__main">
            {(title || subtitle) && (
              <div className="home-faq__header">
                {title && <h2 className="home-faq__title">{title}</h2>}
                {subtitle && <p className="home-faq__subtitle">{subtitle}</p>}
              </div>
            )}
            <div className="home-faq__list">
              {items.map((item, i) => (
                <details key={`${i}:${item.question}`} name={group} className="home-faq__item">
                  <summary className="home-faq__question">
                    <span>{item.question}</span>
                    <span className="home-faq__chevron" aria-hidden="true" />
                  </summary>
                  <p className="home-faq__answer">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}
        {hasCard && (
          <aside className="home-faq__card">
            {ICON_CLASS.test(guaranteeIcon) && (
              <i className={`home-faq__card-icon ${guaranteeIcon}`} aria-hidden="true" />
            )}
            {guaranteeTitle && <h3 className="home-faq__card-title">{guaranteeTitle}</h3>}
            {guaranteeText && <p className="home-faq__card-text">{guaranteeText}</p>}
            {buttonLabel && url && (
              <Link to={url} className="home-faq__card-cta">
                {buttonLabel}
              </Link>
            )}
          </aside>
        )}
      </div>
      {items.length > 0 && (
        // Safe: the string comes from faqJsonLd (JSON.stringify + escaped < > &), never raw HTML.
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(items) }} />
      )}
    </div>
  );
});
