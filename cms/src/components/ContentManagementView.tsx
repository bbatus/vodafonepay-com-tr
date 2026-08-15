import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { DefaultTemplate } from "@payloadcms/next/templates";
import ContentManagementApp from "./ContentManagementApp";

/**
 * RFP feedback 3.10. Top-level custom admin view (registered in
 * payload.config.ts's admin.components.views) — DefaultTemplate is applied
 * explicitly because Payload does NOT auto-wrap brand-new custom view keys
 * in the nav/topbar template (confirmed by reading @payloadcms/next's
 * RootPage source during 3.11's build).
 */
export default async function ContentManagementView(props: {
  payload: Payload;
  i18n: I18nClient;
  locale?: { code: string } | string;
  initPageResult?: {
    req?: PayloadRequest;
    permissions?: unknown;
    visibleEntities?: { collections?: string[]; globals?: string[] };
  };
}) {
  const { payload, i18n, initPageResult } = props;
  const user = (initPageResult?.req as PayloadRequest | undefined)?.user;
  const permissions = initPageResult?.permissions as Parameters<typeof DefaultTemplate>[0]["permissions"];
  const visibleEntities = (initPageResult?.visibleEntities ?? { collections: [], globals: [] }) as Parameters<
    typeof DefaultTemplate
  >[0]["visibleEntities"];
  const req = initPageResult?.req as PayloadRequest;

  return (
    <DefaultTemplate
      req={req}
      payload={payload}
      i18n={i18n}
      locale={props.locale as never}
      user={user as never}
      permissions={permissions}
      visibleEntities={visibleEntities}
      viewType="content-management"
    >
      <ContentManagementApp />
    </DefaultTemplate>
  );
}
