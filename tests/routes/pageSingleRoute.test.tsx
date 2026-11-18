import React from 'react';
import type { ComponentType } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Salla review: a built-in page we replace must keep its hook points, and they must be
// visible in the route file itself.
const loaderData = vi.hoisted(() => ({ page: {} as Record<string, unknown> }));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    ...options,
    useLoaderData: () => loaderData,
  }),
}));
vi.mock('@salla.sa/twilight-theme-engine/api/page', () => ({ page: {} }));
vi.mock('@salla.sa/twilight-theme-engine/routes/page', () => ({ PageSingle: () => null }));
vi.mock('@salla.sa/twilight-theme-engine/tanstack', () => ({ withHead: () => () => ({}) }));
vi.mock('@salla.sa/twilight-theme-engine/hooks', () => ({
  HookSlot: ({ name }: { name: string }) => <i data-slot={name} />,
}));
vi.mock('../../app/components/common', () => ({
  BlockHookSlot: ({ name, scope }: { name: string; scope?: unknown }) => (
    <i data-block-slot={name} data-scope={JSON.stringify(scope)} />
  ),
}));
vi.mock('../../app/components/page/PageSingle', () => ({
  PageSingle: () => <article data-testid="page" />,
}));

async function renderRoute(page: Record<string, unknown>) {
  loaderData.page = page;
  const { Route } = await import('../../app/routes/$slug.page-$id');
  const Component = (Route as unknown as { component: ComponentType }).component;
  return render(<Component />).container;
}

describe('content page route hook points', () => {
  it('renders page:start, the page, the information_page block hook and page:end, in order', async () => {
    const container = await renderRoute({ id: 7, type: 'faq' });
    const order = [...container.children].map(
      (el) => el.getAttribute('data-slot') ?? el.getAttribute('data-block-slot') ?? 'page'
    );
    expect(order).toEqual(['page:start', 'page', 'information_page.information_page', 'page:end']);
    expect(container.querySelector('[data-block-slot]')?.getAttribute('data-scope')).toBe(
      '{"page_id":7}'
    );
  });

  it('renders the same hook points for a page with no type', async () => {
    const container = await renderRoute({ id: 8 });
    expect(container.querySelector('[data-slot="page:start"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="page:end"]')).toBeTruthy();
    expect(container.querySelector('[data-block-slot]')).toBeTruthy();
  });

  it('leaves the information_page block hook to PageSingle on a customised page', async () => {
    const container = await renderRoute({ id: 9, type: 'customised' });
    expect(container.querySelector('[data-slot="page:start"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="page:end"]')).toBeTruthy();
    expect(container.querySelector('[data-block-slot]')).toBeNull();
  });
});
