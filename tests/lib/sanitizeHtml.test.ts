import { describe, expect, it } from 'vitest';
import { sanitizeInlineHtml, sanitizeRichHtml } from '../../app/lib/sanitizeHtml';

const YT = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

describe('sanitizeRichHtml', () => {
  it('returns an empty string for empty input', () => {
    expect(sanitizeRichHtml('')).toBe('');
    expect(sanitizeRichHtml(null)).toBe('');
    expect(sanitizeRichHtml(undefined)).toBe('');
  });

  it('keeps ordinary formatting', () => {
    const html = '<h2>T</h2><p>a <strong>b</strong> <em>c</em></p><ul><li>x</li></ul><hr><blockquote>q</blockquote>';
    expect(sanitizeRichHtml(html)).toBe(html.replace('<hr>', '<hr />'));
  });

  it('removes script elements and their content', () => {
    const out = sanitizeRichHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).toBe('<p>hi</p>');
  });

  it('drops event handlers, including the slash-separated form', () => {
    const out = sanitizeRichHtml('<img/src=x/onerror=alert(1)><p onclick="x()" class="ql-k">t</p>');
    // Browsers read `x/onerror=alert(1)` as the whole unquoted `src` value, so the text
    // survives, but only inside the quoted src, never as an attribute of its own.
    expect(out).toContain('src="x/onerror=alert(1)"');
    expect(out).not.toMatch(/\sonerror=|\sonclick=/i);
    expect(out).toContain('class="ql-k"');
    expect(sanitizeRichHtml('<img src="/a.jpg" onerror="alert(1)"><svg/onload=alert(1)>')).not.toMatch(
      /onerror|onload|alert/i
    );
  });

  it('drops javascript: hrefs: quoted, unquoted and entity-encoded', () => {
    for (const href of [
      'href="javascript:alert(1)"',
      'href=javascript:alert(1)',
      'href="&#106;avascript:alert(1)"',
      'href="&#x6A;avascript:alert(1)"',
      'href=" JaVa\tScRiPt:alert(1)"',
    ]) {
      const out = sanitizeRichHtml(`<a ${href}>x</a>`);
      expect(out, href).not.toMatch(/javascript|alert/i);
      expect(out, href).toContain('x');
    }
  });

  it('keeps safe link schemes and relative / anchor links', () => {
    for (const href of ['https://a.com/x', 'http://a.com', 'mailto:a@b.com', 'tel:+966500000000', '/about', '#top']) {
      expect(sanitizeRichHtml(`<a href="${href}">x</a>`)).toContain(`href="${href}"`);
    }
  });

  it('drops links that leave the store through a slash trick', () => {
    for (const href of ['//evil.com', '/\\evil.com', '\\\\evil.com']) {
      expect(sanitizeRichHtml(`<a href="${href.replace(/\\/g, '&#92;')}">x</a>`)).not.toContain('href');
    }
  });

  it('adds rel to target=_blank and drops other targets', () => {
    const blank = sanitizeRichHtml('<a href="https://a.com" target="_blank">x</a>');
    expect(blank).toContain('target="_blank"');
    expect(blank).toContain('rel="noopener noreferrer"');
    expect(sanitizeRichHtml('<a href="/a" target="evilframe">x</a>')).not.toContain('target');
  });

  it('replaces a merchant-set rel on a _blank link', () => {
    const out = sanitizeRichHtml('<a href="https://a.com" target="_blank" rel="opener">x</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).not.toContain('opener"');
  });

  it('keeps https and relative images, forces lazy loading, drops srcset', () => {
    const out = sanitizeRichHtml('<img src="https://cdn.x/a.jpg" alt="a" width="10" height="20" srcset="b.jpg 2x">');
    expect(out).toContain('src="https://cdn.x/a.jpg"');
    expect(out).toContain('alt="a"');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('decoding="async"');
    expect(out).not.toContain('srcset');
    expect(sanitizeRichHtml('<img src="/img/a.jpg">')).toContain('src="/img/a.jpg"');
  });

  it('writes alt="" on an image with no alt attribute (axe image-alt)', () => {
    expect(sanitizeRichHtml('<img src="/a.jpg">')).toContain(' alt=""');
  });

  it('keeps a merchant alt unchanged, including an explicit empty one', () => {
    const out = sanitizeRichHtml('<img src="/a.jpg" alt="A &quot;red&quot; shoe">');
    expect(out).toContain('alt="A &quot;red&quot; shoe"');
    expect(out.match(/alt=/g)).toHaveLength(1);
    expect(sanitizeRichHtml('<img src="/a.jpg" alt="">').match(/alt=""/g)).toHaveLength(1);
  });

  it('overrides a merchant loading attribute on images', () => {
    expect(sanitizeRichHtml('<img src="/a.jpg" loading="eager">')).toContain('loading="lazy"');
  });

  it('drops data:, http: and protocol-relative image sources', () => {
    for (const src of ['data:image/png;base64,AAAA', 'http://a.com/a.jpg', '//a.com/a.jpg', 'javascript:alert(1)']) {
      expect(sanitizeRichHtml(`<img src="${src}">`), src).not.toContain('src=');
    }
  });

  it('removes svg, math and style elements', () => {
    const out = sanitizeRichHtml(
      '<p>a</p><svg onload="x()"><circle/></svg><math><mi>x</mi></math><style>p{color:red}</style>'
    );
    expect(out).not.toMatch(/<svg|<math|<style|onload|color:red/i);
    expect(out).toContain('<p>a</p>');
  });

  it('keeps YouTube and Vimeo iframes and adds referrer policy and lazy loading', () => {
    const yt = sanitizeRichHtml(`<iframe src="${YT}" width="560" height="315" allowfullscreen></iframe>`);
    expect(yt).toContain(`src="${YT}"`);
    expect(yt).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(yt).toContain('loading="lazy"');
    expect(yt).toContain('allowfullscreen');

    const nocookie = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0';
    expect(sanitizeRichHtml(`<iframe src="${nocookie}"></iframe>`)).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');

    const vimeo = sanitizeRichHtml('<iframe src="https://player.vimeo.com/video/12345?h=abc" title="v"></iframe>');
    expect(vimeo).toContain('player.vimeo.com/video/12345');
  });

  it('drops unknown iframes', () => {
    for (const src of [
      'https://evil.com/embed',
      'http://www.youtube.com/embed/dQw4w9WgXcQ',
      '//www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com.evil.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://player.vimeo.com/video/abc',
      'https://maps.google.com/maps?q=x',
      'javascript:alert(1)',
    ]) {
      expect(sanitizeRichHtml(`<p>k</p><iframe src="${src}"></iframe>`), src).toBe('<p>k</p>');
    }
    expect(sanitizeRichHtml('<iframe></iframe>')).toBe('');
    expect(sanitizeRichHtml('<iframe srcdoc="<script>1</script>"></iframe>')).toBe('');
  });

  it('keeps a Google Maps embed and forces referrer policy and lazy loading', () => {
    const src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3624.5!2d46.67!3d24.71';
    const out = sanitizeRichHtml(`<iframe src="${src}" width="600" height="450" allowfullscreen loading="eager"></iframe>`);
    expect(out).toContain(`src="${src}"`);
    expect(out).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(out).toContain('loading="lazy"');
    expect(out).not.toContain('eager');
  });

  it('drops Google Maps look-alikes and other Google paths', () => {
    for (const src of [
      'https://www.google.com/maps/place/Riyadh',
      'https://www.google.com/maps/embed',
      'https://www.google.com/maps/embed/v1/place?key=x',
      'https://www.google.com/maps/embed?pb=1 onload=x',
      'http://www.google.com/maps/embed?pb=1',
      'https://evil.com/maps/embed?pb=1',
      'https://www.google.com.evil.com/maps/embed?pb=1',
      'https://google.com/maps/embed?pb=1',
      'https://www.google.com/maps/embed?pb=<script>',
    ]) {
      expect(sanitizeRichHtml(`<p>k</p><iframe src="${src}"></iframe>`), src).toBe('<p>k</p>');
    }
  });

  it('does not allow a Google Maps embed in inline mode', () => {
    expect(sanitizeInlineHtml('<iframe src="https://www.google.com/maps/embed?pb=1"></iframe>')).toBe('');
  });

  it('strips srcdoc and sandbox-ish extras from an allowed iframe', () => {
    const out = sanitizeRichHtml(`<iframe src="${YT}" srcdoc="<b>x</b>" onload="x()"></iframe>`);
    expect(out).not.toMatch(/srcdoc|onload/);
  });

  it('keeps only text-align and direction in style, with allowed values', () => {
    const out = sanitizeRichHtml(
      '<p style="text-align: center; color: red; position: fixed; direction: rtl; background: url(javascript:1)">x</p>'
    );
    expect(out).toContain('text-align:center');
    expect(out).toContain('direction:rtl');
    expect(out).not.toMatch(/color|position|background|url/);
    expect(sanitizeRichHtml('<p style="text-align: expression(alert(1))">x</p>')).not.toContain('expression');
    expect(sanitizeRichHtml('<p style="color:red">x</p>')).toBe('<p>x</p>');
  });

  it('turns h1 into h2', () => {
    expect(sanitizeRichHtml('<h1>Title</h1>')).toBe('<h2>Title</h2>');
  });

  it('keeps tables with colspan, rowspan and scope', () => {
    const out = sanitizeRichHtml(
      '<table><caption>c</caption><thead><tr><th scope="col" colspan="2">h</th></tr></thead><tbody><tr><td rowspan="2">a</td></tr></tbody></table>'
    );
    expect(out).toContain('colspan="2"');
    expect(out).toContain('rowspan="2"');
    expect(out).toContain('scope="col"');
    expect(out).toContain('<caption>');
  });

  it('keeps only ql-* editor classes', () => {
    expect(sanitizeRichHtml('<p class="ql-align-center fixed inset-0 z-50">x</p>')).toBe(
      '<p class="ql-align-center">x</p>'
    );
    expect(sanitizeRichHtml('<p class="fixed inset-0">x</p>')).toBe('<p>x</p>');
    expect(sanitizeRichHtml('<p class="QL-x ql- ql-a_b ql-ok">x</p>')).toBe('<p class="ql-ok">x</p>');
    expect(sanitizeRichHtml('<span class="ql-size-large  ql-font-serif">x</span>')).toBe(
      '<span class="ql-size-large ql-font-serif">x</span>'
    );
  });

  it('keeps dir, lang and title but not id or data-*', () => {
    const out = sanitizeRichHtml('<div class="a" dir="rtl" lang="ar" title="t" id="x" data-y="1">z</div>');
    expect(out).not.toContain('class');
    expect(out).toContain('dir="rtl"');
    expect(out).toContain('lang="ar"');
    expect(out).toContain('title="t"');
    expect(out).not.toMatch(/id=|data-/);
  });

  it('removes forms and form controls', () => {
    const out = sanitizeRichHtml('<form action="/x"><input name="a"><button>go</button><textarea>t</textarea></form>');
    expect(out).not.toMatch(/<form|<input|<button|<textarea/);
  });

  it('keeps Arabic text and escapes stray markup characters', () => {
    expect(sanitizeRichHtml('<p>مرحبا &amp; أهلا</p>')).toBe('<p>مرحبا &amp; أهلا</p>');
    expect(sanitizeRichHtml('<p>1 &lt; 2</p>')).toBe('<p>1 &lt; 2</p>');
  });

  it('closes tags the merchant left open', () => {
    expect(sanitizeRichHtml('<div><p>a <strong>b')).toBe('<div><p>a <strong>b</strong></p></div>');
    expect(sanitizeRichHtml('<ul><li>one<li>two')).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('removes a script nested in an allowed tag together with its content', () => {
    const out = sanitizeRichHtml('<div>a<p>b<script>alert(1)</script>c</p><style>p{}</style>d</div>');
    expect(out).toBe('<div>a<p>bc</p>d</div>');
    expect(sanitizeRichHtml('<p><svg><script>x()</script><a href="/x">t</a></svg>ok</p>')).toBe('<p>ok</p>');
    expect(sanitizeRichHtml('<textarea><script>x()</script>t</textarea>z')).toBe('z');
  });

  it('keeps the output well formed after a closing tag with no opening tag', () => {
    const out = sanitizeRichHtml('a</p><strong>b</strong></div></li>c');
    expect(out).not.toMatch(/<\/(div|li)>/);
    expect(out).toContain('<strong>b</strong>');
    expect(out.replace(/<p><\/p>/g, '')).toBe('a<strong>b</strong>c');
  });

  it('escapes quotes and angle brackets in attribute values and text', () => {
    const out = sanitizeRichHtml('<p title=\'a "b" <c> &amp; d\'>x &lt;script&gt;</p>');
    expect(out).toBe('<p title="a &quot;b&quot; &lt;c&gt; &amp; d">x &lt;script&gt;</p>');
    const link = sanitizeRichHtml('<a href=\'/x?a="1"&b=2\'>t</a>');
    expect(link).toBe('<a href="/x?a=&quot;1&quot;&amp;b=2">t</a>');
  });

  it('is stable when run twice', () => {
    const once = sanitizeRichHtml(`<h1>a</h1><iframe src="${YT}"></iframe><a href="/x" target="_blank">l</a>`);
    expect(sanitizeRichHtml(once)).toBe(once);
  });
});

describe('sanitizeInlineHtml', () => {
  it('returns an empty string for empty input', () => {
    expect(sanitizeInlineHtml('')).toBe('');
    expect(sanitizeInlineHtml(null)).toBe('');
  });

  it('keeps br strong b em i u a span', () => {
    const html = 'a<br />b <strong>c</strong> <b>d</b> <em>e</em> <i>f</i> <u>g</u> <span>h</span>';
    expect(sanitizeInlineHtml(html)).toBe(html);
  });

  it('drops block tags but keeps their text', () => {
    const out = sanitizeInlineHtml('<p>one</p><div>two</div><ul><li>three</li></ul><h2>four</h2>');
    expect(out).not.toMatch(/<(p|div|ul|li|h2)\b/);
    expect(out).toContain('one');
    expect(out).toContain('four');
  });

  it('drops images, iframes, scripts, styles and attributes other than link ones', () => {
    const out = sanitizeInlineHtml(
      '<img src="/a.jpg"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe><script>1</script><span class="x" style="color:red" onclick="y()">s</span>'
    );
    expect(out).toBe('<span>s</span>');
  });

  it('applies the same link rules', () => {
    expect(sanitizeInlineHtml('<a href="javascript:alert(1)">x</a>')).not.toMatch(/javascript/i);
    expect(sanitizeInlineHtml('<a href="//evil.com">x</a>')).not.toContain('href');
    const blank = sanitizeInlineHtml('<a href="https://a.com" target="_blank">x</a>');
    expect(blank).toContain('rel="noopener noreferrer"');
    expect(sanitizeInlineHtml('<a href="mailto:a@b.com">x</a>')).toContain('mailto:a@b.com');
  });
});
