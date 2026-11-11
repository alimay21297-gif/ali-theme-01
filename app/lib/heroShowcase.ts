import type { ShowcaseAnimation, ShowcaseProduct } from '../components/home/ProductShowcase';
import { linkUrl, safeUrl } from './safeUrl';

/** A dropdown value arrives as a string or as `[{ value }]`. */
function choice(raw: unknown): string | undefined {
  const first = Array.isArray(raw) ? raw[0] : raw;
  return typeof first === 'string' ? first : (first as { value?: string } | undefined)?.value;
}

/** A layer item arrives as `{ image }`, `{ '<id>.image': … }` or a bare URL. */
function layerImage(item: unknown, id: string): string | undefined {
  if (typeof item === 'string') return safeUrl(item);
  const record = item as Record<string, unknown> | null;
  // An unsafe address counts as missing, so the layer is dropped.
  return safeUrl(record?.image ?? record?.[`${id}.image`]);
}

function percent(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : undefined;
}

function parseProduct(data: Record<string, unknown>, n: 1 | 2): ShowcaseProduct | null {
  const p = `p${n}`;
  const url = linkUrl(data[`${p}_link`]);
  // Defence in depth (the field is an image picker): an unsafe value counts as
  // missing, so the product is left out.
  const body = safeUrl(data[`${p}_body`]);
  const rawLayers = data[`${p}_layers`];
  const layers = (Array.isArray(rawLayers) ? rawLayers : [])
    .map((item) => layerImage(item, `${p}_layers`))
    .filter((src): src is string => Boolean(src))
    .slice(0, 3);

  // A product needs its page, its front image and at least one layer behind it.
  if (!url || !body || layers.length === 0) return null;

  const chosen = choice(data[`${p}_type`]);
  const type: ShowcaseAnimation = chosen === 'swing' ? 'swing' : 'slide';
  const name = data[`${p}_name`];

  return {
    type,
    url,
    name: typeof name === 'string' && name.trim() ? name.trim() : undefined,
    body,
    layers,
    pivotX: percent(data[`${p}_pivot_x`]),
    pivotY: percent(data[`${p}_pivot_y`]),
  };
}

/**
 * The hero's animated products. Empty unless the `animate_products` switch is on;
 * a product that lacks its link, its front image or its layers is left out. An
 * empty result means the hero shows its single image instead.
 */
export function parseShowcase(data: Record<string, unknown>): ShowcaseProduct[] {
  if (data.animate_products !== true) return [];
  return ([1, 2] as const)
    .map((n) => parseProduct(data, n))
    .filter((product): product is ShowcaseProduct => product !== null);
}
