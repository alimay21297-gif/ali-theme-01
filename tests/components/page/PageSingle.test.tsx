import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PageSingle, type PageWithType } from '../../../app/components/page/PageSingle';

vi.mock('@salla.sa/twilight-theme-engine/hooks/useComments', () => ({
  useComments: () => ({ commentsKey: 0, refresh: vi.fn() }),
}));

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Breadcrumb: ({ page }: { page: { title: string } }) => (
    <nav className="breadcrumb">{page.title}</nav>
  ),
}));

// `<salla-comments>` loads its list once, when it is first attached, and does not
// reload when `item-id` changes. The mock records the item id of every mount.
// `vi.hoisted` shares the list with the hoisted factory.
const commentMounts = vi.hoisted<number[]>(() => []);

vi.mock('@salla.sa/twilight-components-react/comments', () => ({
  SallaComments: ({ itemId }: { itemId: number }) => {
    const [mountedFor] = React.useState(itemId);
    React.useEffect(() => void commentMounts.push(mountedFor), [mountedFor]);
    return <div className="salla-comments" data-item-id={itemId} />;
  },
}));

vi.mock('../../../app/components/common/BlockHookSlot', () => ({
  BlockHookSlot: ({
    name,
    wrapper,
    className,
    scope,
  }: {
    name: string;
    wrapper: string;
    className?: string;
    scope?: unknown;
  }) => (
    <div
      className="block-hook-slot"
      data-name={name}
      data-wrapper={wrapper}
      data-class={className}
      data-scope={JSON.stringify(scope)}
    />
  ),
}));

function makePage(overrides: Partial<PageWithType> = {}): PageWithType {
  return {
    slug: 'about-us',
    id: 42,
    title: 'About Us',
    url: '/about-us',
    content: '<p>Hello&nbsp;world</p>',
    metadata: undefined,
    created_at: { published_time: '2026-01-01T00:00:00Z' },
    ...overrides,
  };
}

describe('PageSingle', () => {
  describe('customised pages', () => {
    it('renders only the information_page app hook, nothing else', () => {
      const { container } = render(<PageSingle page={makePage({ type: 'customised' })} />);

      const hook = container.querySelector('.block-hook-slot');
      expect(hook).toBeTruthy();
      expect(hook?.getAttribute('data-name')).toBe('information_page.information_page');
      expect(hook?.getAttribute('data-wrapper')).toBe('s-information-page');
      expect(hook?.getAttribute('data-class')).toBe('!mt-0');
      expect(hook?.getAttribute('data-scope')).toBe('{"page_id":42}');

      expect(container.querySelector('.breadcrumb')).toBeNull();
      expect(container.querySelector('.content-entry')).toBeNull();
      expect(container.querySelector('.salla-comments')).toBeNull();
      expect(container.querySelector('h1')).toBeNull();
    });
  });

  describe('ordinary pages', () => {
    it('renders the breadcrumb, title, cleaned content and comments', () => {
      const { container } = render(<PageSingle page={makePage()} />);

      expect(container.querySelector('.block-hook-slot')).toBeNull();
      expect(container.querySelector('.breadcrumb')?.textContent).toBe('About Us');
      expect(container.querySelector('h1')?.textContent).toBe('About Us');

      const content = container.querySelector('.content-entry');
      expect(content?.innerHTML).toBe('<p>Hello world</p>');

      const comments = container.querySelector('.salla-comments');
      expect(comments?.getAttribute('data-item-id')).toBe('42');
    });

    it('keeps formatting and links but drops script and event handlers from the content', () => {
      const { container } = render(
        <PageSingle
          page={makePage({
            content:
              '<p>Hi&nbsp;<strong>bold</strong> <a href="https://a.com/x">link</a></p>' +
              '<script>window.pwned=1</script><img src="https://a.com/i.png" onerror="window.pwned=2">' +
              '<a href="javascript:alert(1)" onclick="x()">bad</a>',
          })}
        />
      );

      const content = container.querySelector('.content-entry') as HTMLElement;
      expect(content.querySelector('script')).toBeNull();
      expect(content.innerHTML).not.toMatch(/onerror|onclick|javascript:|pwned/);
      expect(content.querySelector('strong')?.textContent).toBe('bold');
      expect(content.querySelector('a[href="https://a.com/x"]')?.textContent).toBe('link');
      expect(content.querySelector('img')?.getAttribute('src')).toBe('https://a.com/i.png');
      // the `&nbsp;` swap still happens before the sanitiser
      expect(content.textContent).toContain('Hi bold');
    });

    it('omits the content block when the page has no content', () => {
      const { container } = render(<PageSingle page={makePage({ content: undefined })} />);
      expect(container.querySelector('.content-entry')).toBeNull();
    });

    it('omits comments when the page has no id', () => {
      const { container } = render(<PageSingle page={makePage({ id: undefined })} />);
      expect(container.querySelector('.salla-comments')).toBeNull();
    });

    it('treats any non-customised type the same as the default layout', () => {
      const { container } = render(<PageSingle page={makePage({ type: 'faq' })} />);
      expect(container.querySelector('.block-hook-slot')).toBeNull();
      expect(container.querySelector('h1')?.textContent).toBe('About Us');
    });

    it("loads the next page's comments when the router moves between two pages", () => {
      commentMounts.length = 0;
      // The route's loader sets the same slug (the route id) for every page.
      const { rerender } = render(<PageSingle page={makePage({ slug: 'page-single', id: 1 })} />);
      rerender(<PageSingle page={makePage({ slug: 'page-single', id: 2, title: 'Privacy' })} />);

      expect(commentMounts).toEqual([1, 2]);
    });
  });
});
