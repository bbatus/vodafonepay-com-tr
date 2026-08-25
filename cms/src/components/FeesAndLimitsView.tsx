import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { loadDbStrings } from "@/lib/loadDbStrings";
import FeesAndLimitsApp from "./FeesAndLimitsApp";

/**
 * RFP follow-up: "ücret ve limit tabloları sidebarda ve sayfa yapısı olarak
 * 2 ayrı collection değil, tek sayfada tabli geçişle yönetilebilmeli."
 * Same top-level-view pattern as ContentManagementView/AccessMatrixView —
 * DefaultTemplate is applied explicitly because Payload does NOT auto-wrap
 * a brand-new custom view key in the nav/topbar template.
 *
 * FeeRows/LimitTables stay real, separate Payload collections underneath
 * (their own access rules, drafts, audit hooks, `order` field are
 * untouched) — this page links out to their real edit/create routes
 * (/admin/collections/fee-rows/{id}) rather than reimplementing full CRUD.
 * Their own sidebar entries stay too (see FeeRows.ts's comment for why
 * `admin.hidden` couldn't remove them without breaking those same links) —
 * this combined page is the promoted, intended entry point, not the only one.
 */
export default async function FeesAndLimitsView(props: {
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
      viewType="fees-and-limits"
    >
      {user ? <FeesAndLimitsApp /> : <p className="cm-error">{t("contentManagement.loginRequired")}</p>}
    </DefaultTemplate>
  );
}
