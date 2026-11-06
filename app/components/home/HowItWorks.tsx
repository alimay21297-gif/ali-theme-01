import { memo, useEffect, useRef, useState } from 'react';
import { Image } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useCalligraphy } from '../../hooks/useCalligraphy';

export interface HowItWorksProps {
  data: {
    title?: string;
    subtitle?: string;
    image?: string;
    /** Collection (twilight.json `steps`): each entry is `{ icon, title, text }` (or `{ 'steps.icon': … }`). */
    steps?: unknown;
    position?: number;
    [key: string]: unknown;
  };
}

interface Step {
  icon: string;
  title: string;
  text: string;
}

/** Only Salla icon classes reach `className`; anything else renders a step without an icon. */
const ICON_CLASS = /^sicon-[a-z0-9-]+$/;

const MIN_STEPS = 2;
const MAX_STEPS = 4;

function field(item: Record<string, unknown>, name: string): string {
  const value = item[name] ?? item[`steps.${name}`];
  return typeof value === 'string' ? value.trim() : '';
}

function parseSteps(raw: unknown): Step[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({ icon: field(item, 'icon'), title: field(item, 'title'), text: field(item, 'text') }))
    .filter((step) => step.title)
    .slice(0, MAX_STEPS);
}

/** The step number in the page language: Arabic-Indic digits in Arabic, Latin otherwise. */
export function formatStepNumber(n: number, locale: string): string {
  const tag = locale.toLowerCase().startsWith('ar') ? 'ar-u-nu-arab' : 'en-u-nu-latn';
  return new Intl.NumberFormat(tag, { useGrouping: false }).format(n);
}

/**
 * Reveals the steps one after another when the list scrolls into view. `armed` is
 * only true once the observer is set up (so with no JS, or with reduced motion, the
 * steps are simply shown); `visible` flips when the list is first seen.
 */
function useReveal() {
  const ref = useRef<HTMLOListElement>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduced || !('IntersectionObserver' in window)) return;
    setArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, armed, visible };
}

/**
 * `how-it-works` home block (`s-block--how-it-works`): a dark band explaining a
 * process in 2–4 numbered steps (icon, title, short text) with an optional image
 * (for example a phone screenshot) beside them on desktop and below them on phones.
 * A deep-green surface with the calligraphy at 60% strength, thinned behind the
 * content (see `home-how-it-works.scss`). Plain text only; React escapes it.
 * Fewer than 2 valid steps renders nothing.
 */
export const HowItWorks = memo(function HowItWorks({ data }: HowItWorksProps) {
  const { locale } = useTranslation();
  const calligraphy = useCalligraphy(0.6);
  const { ref, armed, visible } = useReveal();
  const steps = parseSteps(data.steps);

  if (steps.length < MIN_STEPS) return null;

  const title = data.title?.trim();
  const subtitle = data.subtitle?.trim();
  const image = data.image || undefined;

  return (
    <div className={`home-how ${calligraphy.className}`.trim()} style={calligraphy.style}>
      <div className="container">
        {(title || subtitle) && (
          <div className="home-how__header">
            {title && <h2 className="home-how__title">{title}</h2>}
            {subtitle && <p className="home-how__subtitle">{subtitle}</p>}
          </div>
        )}
        <div className={`home-how__body${image ? ' home-how__body--with-image' : ''}`}>
          <ol
            ref={ref}
            className={`home-how__steps${armed ? ' is-armed' : ''}${visible ? ' is-visible' : ''}`}
            style={{ '--steps-count': steps.length } as React.CSSProperties}
          >
            {steps.map((step, i) => (
              <li key={`${i}:${step.title}`} className="home-how__step" style={{ '--i': i } as React.CSSProperties}>
                <span className="home-how__num" aria-hidden="true">
                  {formatStepNumber(i + 1, locale)}
                </span>
                <div className="home-how__content">
                  {ICON_CLASS.test(step.icon) && <i className={`home-how__icon ${step.icon}`} aria-hidden="true" />}
                  <h3 className="home-how__step-title">{step.title}</h3>
                  {step.text && <p className="home-how__step-text">{step.text}</p>}
                </div>
              </li>
            ))}
          </ol>
          {image && (
            <div className="home-how__media">
              <Image
                src={image}
                alt={title || ''}
                width={560}
                height={720}
                objectFit="contain"
                srcSetWidths={[320, 480, 640]}
                sizes="(min-width: 1024px) 40vw, 80vw"
                className="home-how__image"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
