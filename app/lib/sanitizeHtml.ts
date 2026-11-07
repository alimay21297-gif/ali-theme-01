import { Parser } from 'htmlparser2';

/**
 * Allow-list sanitisers for merchant-authored HTML (product descriptions, pages, brands).
 *
 * Built on htmlparser2's streaming `Parser`: a string tokenizer with no DOM, so it runs the
 * same way in workerd (SSR) and in the browser and the server and client HTML stay identical.
 * The output is REBUILT from tokens, never copied from the input:
 * - a tag is written only if it is on the list, with only the attributes listed for it;
 * - text is escaped (& < >) and attribute values are escaped (& " < >) and always double-quoted;
 * - the parser decodes entities first, so every scheme and style check sees the real value;
 * - script, style, svg, math, forms' textarea, objects and any iframe that is not an allowed
 *   player are dropped WITH their content.
 *
 * Two entry points:
 * - `sanitizeRichHtml`   product / page content (blocks, lists, tables, images, video).
 * - `sanitizeInlineHtml` text that sits inside a `<p>` (only inline tags).
 */

const VOID_TAGS = new Set(['br', 'hr', 'img']);

/** Dropped together with everything inside them (the text of a script is not content). */
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'noscript', 'template', 'textarea', 'title', 'svg', 'math',
  'object', 'embed', 'applet', 'xmp', 'noembed', 'noframes', 'iframe',
]);

const LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

/** The only embeds allowed (players and a Google map). The path/id is checked, not just the host. */
const IFRAME_SRC = [
  /^https:\/\/www\.youtube\.com\/embed\/[\w-]{11}(?:[?#]\S*)?$/,
  /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}(?:[?#]\S*)?$/,
  /^https:\/\/player\.vimeo\.com\/video\/\d+(?:[?#]\S*)?$/,
  // Google Maps "Share > Embed a map": that host and that exact path, then query characters only.
  /^https:\/\/www\.google\.com\/maps\/embed\?[\w\-.~%!$&'()*+,;=:@/?]+$/,
];

/** `allow` features a player may ask for; anything else is dropped from the list. */
const IFRAME_FEATURES = new Set([
  'accelerometer', 'autoplay', 'clipboard-write', 'encrypted-media', 'fullscreen',
  'gyroscope', 'picture-in-picture', 'web-share',
]);

const STYLE_VALUES: Record<string, RegExp> = {
  'text-align': /^(?:start|end|left|right|center|justify)$/,
  direction: /^(?:rtl|ltr)$/,
};

const escapeText = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Control characters and spaces browsers ignore while reading an address. */
const stripIgnorable = (value: string) => value.replace(/[\u0000- \u007f]/g, '');

/**
 * A relative address that browsers would read as another host: `//host`, and `/\host`
 * (the backslash counts as a slash).
 */
const leavesTheStore = (value: string) => /^[/\\]{2}/.test(stripIgnorable(value));

/** The scheme of an address (lower-case), `''` for a relative one. */
function schemeOf(value: string): string {
  return /^([a-z][a-z0-9+.-]*):/i.exec(stripIgnorable(value))?.[1].toLowerCase() ?? '';
}

/** Value of a link `href`, or undefined when it must go. */
function safeHref(value: string): string | undefined {
  const scheme = schemeOf(value);
  if (scheme ? !LINK_SCHEMES.has(scheme) : leavesTheStore(value)) return undefined;
  return value.trim();
}

/** Value of an image `src`: https or relative only. */
function safeImageSrc(value: string): string | undefined {
  const scheme = schemeOf(value);
  if (scheme ? scheme !== 'https' : leavesTheStore(value)) return undefined;
  return value.trim();
}

/** Only `text-align` and `direction`, with listed values; the string is rebuilt. */
function safeStyle(value: string): string | undefined {
  const kept = new Map<string, string>();
  for (const declaration of value.split(';')) {
    const at = declaration.indexOf(':');
    if (at < 0) continue;
    const property = declaration.slice(0, at).trim().toLowerCase();
    const setting = declaration.slice(at + 1).trim().toLowerCase();
    if (STYLE_VALUES[property]?.test(setting)) kept.set(property, setting);
  }
  return kept.size ? [...kept].map(([p, v]) => `${p}:${v}`).join(';') : undefined;
}

/**
 * Only the editor's own classes (`ql-align-center`, `ql-video`…) survive. Any other token,
 * such as a Tailwind `fixed inset-0 z-50`, could restyle the page from merchant content.
 */
function safeClass(value: string | undefined): string | undefined {
  const kept = (value ?? '').split(/\s+/).filter((token) => /^ql-[a-z0-9-]+$/.test(token));
  return kept.length ? kept.join(' ') : undefined;
}

const number = (value: string, max: number) =>
  new RegExp(`^\\d{1,${max}}$`).test(value) ? value : undefined;

const dimension = (value: string) => (/^\d{1,5}%?$/.test(value) ? value : undefined);

const allowedFeatures = (value: string) =>
  value
    .split(';')
    .map((feature) => feature.trim().toLowerCase().split(/\s+/)[0])
    .filter((feature) => IFRAME_FEATURES.has(feature))
    .join('; ') || undefined;

interface Mode {
  tags: ReadonlySet<string>;
  /** Attributes any allowed tag may carry. */
  global: boolean;
  /** An `<iframe>` with an allowed player address is kept. */
  iframes: boolean;
}

const RICH: Mode = {
  tags: new Set([
    'p', 'br', 'hr', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
    'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'figure', 'figcaption',
    'iframe',
  ]),
  global: true,
  iframes: true,
};

const INLINE: Mode = {
  tags: new Set(['br', 'strong', 'b', 'em', 'i', 'u', 'a', 'span']),
  global: false,
  iframes: false,
};

/** The attributes (already escaped, in a fixed order) an allowed tag is written with. */
function attributesFor(tag: string, attribs: Record<string, string>, mode: Mode): string {
  const out: string[] = [];
  const add = (name: string, value: string | undefined) => {
    if (value !== undefined) out.push(` ${name}="${escapeAttr(value)}"`);
  };

  if (mode.global) {
    add('class', safeClass(attribs.class));
    if (/^(?:ltr|rtl|auto)$/i.test(attribs.dir ?? '')) add('dir', attribs.dir.toLowerCase());
    if (/^[a-z0-9-]{1,35}$/i.test(attribs.lang ?? '')) add('lang', attribs.lang);
    if (attribs.title) add('title', attribs.title);
    if (attribs.style) add('style', safeStyle(attribs.style));
  }

  if (tag === 'a') {
    if (attribs.href !== undefined) add('href', safeHref(attribs.href));
    if (attribs.target === '_blank') {
      add('target', '_blank');
      add('rel', 'noopener noreferrer');
    }
  } else if (tag === 'img') {
    if (attribs.src !== undefined) add('src', safeImageSrc(attribs.src));
    if (attribs.alt !== undefined) add('alt', attribs.alt);
    if (attribs.width) add('width', dimension(attribs.width));
    if (attribs.height) add('height', dimension(attribs.height));
    add('loading', 'lazy');
    add('decoding', 'async');
  } else if (tag === 'th' || tag === 'td') {
    if (attribs.colspan) add('colspan', number(attribs.colspan, 3));
    if (attribs.rowspan) add('rowspan', number(attribs.rowspan, 3));
    if (/^(?:col|row|colgroup|rowgroup)$/i.test(attribs.scope ?? '')) add('scope', attribs.scope.toLowerCase());
  } else if (tag === 'iframe') {
    add('src', attribs.src);
    if (attribs.width) add('width', dimension(attribs.width));
    if (attribs.height) add('height', dimension(attribs.height));
    if (attribs.title) add('title', attribs.title);
    if (attribs.allow) add('allow', allowedFeatures(attribs.allow));
    if (attribs.allowfullscreen !== undefined) out.push(' allowfullscreen');
    add('referrerpolicy', 'strict-origin-when-cross-origin');
    add('loading', 'lazy');
  }

  return out.join('');
}

interface Open {
  /** What to write on close; undefined when nothing was written for the open tag. */
  close?: string;
}

function sanitize(html: string | null | undefined, mode: Mode): string {
  if (!html) return '';

  let out = '';
  const stack: Open[] = [];
  /** Stack depth of the element being skipped with its content; -1 when none. */
  let skipFrom = -1;

  const parser = new Parser({
    onopentag(name, attribs) {
      // Inside a skipped element: keep the stack in step, write nothing.
      if (skipFrom >= 0) {
        stack.push({});
        return;
      }

      if (name === 'iframe' && mode.iframes && IFRAME_SRC.some((p) => p.test(attribs.src ?? ''))) {
        out += `<iframe${attributesFor('iframe', attribs, mode)}>`;
        stack.push({ close: '</iframe>' });
        skipFrom = stack.length - 1; // the player's inner content is never written
        return;
      }

      if (DROP_WITH_CONTENT.has(name)) {
        stack.push({});
        skipFrom = stack.length - 1;
        return;
      }

      if (!mode.tags.has(name)) {
        // Unknown tag: the tag goes, its text stays.
        stack.push({});
        return;
      }

      const tag = name === 'h1' ? 'h2' : name;
      if (VOID_TAGS.has(tag)) {
        out += `<${tag}${attributesFor(tag, attribs, mode)} />`;
        stack.push({});
        return;
      }
      out += `<${tag}${attributesFor(tag, attribs, mode)}>`;
      stack.push({ close: `</${tag}>` });
    },

    ontext(text) {
      if (skipFrom < 0) out += escapeText(text);
    },

    onclosetag() {
      const open = stack.pop();
      if (open?.close !== undefined && (skipFrom < 0 || skipFrom === stack.length)) out += open.close;
      if (skipFrom === stack.length) skipFrom = -1;
    },
  });

  parser.write(html);
  parser.end();

  // `end()` closes what the parser still holds open; this covers anything left over.
  while (stack.length) {
    const open = stack.pop();
    if (open?.close !== undefined && (skipFrom < 0 || skipFrom === stack.length)) out += open.close;
    if (skipFrom === stack.length) skipFrom = -1;
  }

  return out;
}

/** Product / page content: blocks, lists, tables, images, and YouTube / Vimeo players. */
export function sanitizeRichHtml(html: string | null | undefined): string {
  return sanitize(html, RICH);
}

/** Text inside a `<p>`: only inline tags (`br strong b em i u a span`). */
export function sanitizeInlineHtml(html: string | null | undefined): string {
  return sanitize(html, INLINE);
}
