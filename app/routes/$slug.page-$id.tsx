import { createFileRoute } from '@tanstack/react-router';
import { page as pageApi } from '@salla.sa/twilight-theme-engine/api/page';
import { PageSingle as EnginePageSingle } from '@salla.sa/twilight-theme-engine/routes/page';
import { withHead } from '@salla.sa/twilight-theme-engine/tanstack';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { BlockHookSlot } from '../components/common';
import { PageSingle, type PageSingleProps } from '../components/page/PageSingle';

export const Route = createFileRoute('/{-$locale}/$slug/page-{$id}')({
  loader: async ({ params }): Promise<PageSingleProps> => {
    const data = await pageApi.findOrThrow(params.id);
    return {
      page: {
        // RouteId.PAGE_SINGLE, which the engine does not export.
        slug: 'page-single',
        id: data.id,
        title: data.name,
        url: data.url,
        content: data.content,
        metadata: data.metadata,
        created_at: data.created_at,
        type: data.type,
      },
    };
  },
  head: withHead(EnginePageSingle),
  component: PageSingleComponent,
});

/**
 * The hook points live here, in the route that replaces the engine page, so every content
 * page keeps them (Salla review: partner apps inject through them). The engine's own
 * convention is `<area>:start` / `<area>:end`; its `HookName` enum has no page names, and
 * `HookSlot` accepts any string. The classic `information_page.information_page` block hook
 * is rendered for every page type; a `customised` page renders it itself, as its whole body.
 */
function PageSingleComponent() {
  const data = Route.useLoaderData();
  const { page } = data;
  return (
    <>
      <HookSlot name="page:start" />
      <PageSingle {...data} />
      {page.type !== 'customised' && (
        <BlockHookSlot
          name="information_page.information_page"
          wrapper="s-information-page"
          scope={page.id != null ? { page_id: page.id } : undefined}
        />
      )}
      <HookSlot name="page:end" />
    </>
  );
}
