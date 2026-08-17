import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { loadDbStrings } from "@/lib/loadDbStrings";
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
  // Payload does NOT redirect an anonymous visitor away from a top-level
  // custom view the way it does for its own collection views — confirmed live:
  // this page rendered its full collection summary with no session cookie at
  // all, showing the public/published counts. Every count still came from
  // access-checked API calls (nothing private leaked), but a report page that
  // greets logged-out visitors is not what "her user burayı görebilsin" meant.
  const user = (initPageResult?.req as PayloadRequest | undefined)?.user;
  const t = await loadDbStrings(payload, i18n.language === "en" ? "en" : "tr");
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
      {user ? <ContentManagementApp /> : <p className="cm-error">{t("contentManagement.loginRequired")}</p>}
    </DefaultTemplate>
  );
}
