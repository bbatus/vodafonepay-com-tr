import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { loadDbStrings } from "@/lib/loadDbStrings";
import { ROLES } from "@/access/roles";
import LockedAccountsApp from "./LockedAccountsApp";

/**
 * RFP feedback 5.6. Top-level custom admin view, same shape as
 * ContentManagementView — DefaultTemplate is applied by hand because Payload
 * does not auto-wrap brand-new custom view keys in the nav/topbar template.
 *
 * The role check here matters on its own: Payload does NOT pass a `user`
 * prop to top-level custom views (it only lives on `initPageResult.req`), and
 * a view that forgets that renders for everyone — that exact bug shipped once
 * already on the old Waiting Approvals screen. Note this is defence in depth
 * for the SCREEN; the unlock action itself is gated server-side by
 * `Users.access.unlock`.
 */
export default async function LockedAccountsView(props: {
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
  const req = initPageResult?.req as PayloadRequest;
  const user = req?.user as { role?: string } | undefined;
  const permissions = initPageResult?.permissions as Parameters<typeof DefaultTemplate>[0]["permissions"];
  const visibleEntities = (initPageResult?.visibleEntities ?? { collections: [], globals: [] }) as Parameters<
    typeof DefaultTemplate
  >[0]["visibleEntities"];
  const locale = i18n.language === "en" ? "en" : "tr";
  const t = await loadDbStrings(payload, locale);

  return (
    <DefaultTemplate
      req={req}
      payload={payload}
      i18n={i18n}
      locale={props.locale as never}
      user={req?.user as never}
      permissions={permissions}
      visibleEntities={visibleEntities}
      viewType="locked-accounts"
    >
      {user?.role === ROLES.NEW_VERTICAL_MAKER ? (
        <LockedAccountsApp />
      ) : (
        <div className="locked-accounts">
          <h1>{t("lockedAccounts.title")}</h1>
          <p className="locked-accounts__error">{t("lockedAccounts.forbidden")}</p>
        </div>
      )}
    </DefaultTemplate>
  );
}
