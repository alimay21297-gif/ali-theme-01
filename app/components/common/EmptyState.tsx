import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Decorative icon (an SVG from `../icons`); hidden from assistive tech. */
  icon: ReactNode;
  title: string;
  /** One short line under the title. */
  hint?: string;
  /** The button or link. Style it with `s-empty-state__action` or `s-empty-state__link`. */
  children?: ReactNode;
}

/**
 * Centred empty / error state: icon, heading, one line and one action. It keeps the
 * engine's `no-content-placeholder` class, but the engine `NoContent` takes only an
 * icon font, one line and a link, so it cannot carry a heading, a decorative icon or
 * a 44px button. Used by the product listing (`ListingEmpty`) and the cart
 * (`CartEmpty`, the load-error state). Styling: `04-components/empty-state.scss`.
 */
export function EmptyState({ icon, title, hint, children }: EmptyStateProps) {
  return (
    <div className="no-content-placeholder s-empty-state">
      <span className="s-empty-state__icon" aria-hidden="true">
        {icon}
      </span>
      <h2 className="s-empty-state__title">{title}</h2>
      {hint && <p className="s-empty-state__hint">{hint}</p>}
      {children}
    </div>
  );
}
