import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { loadDbStrings } from "@/lib/loadDbStrings";
import { ROLES } from "@/access/roles";
import AccessMatrixApp from "./AccessMatrixApp";

/**
 * RFP §7 "userID comparison tables" — top-level custom view, same shape as
 * LockedAccountsView (DefaultTemplate applied by hand; role re-checked here
 * because top-level custom views don't get a `user` prop, only `req.user`).
 *
 * Follow-up 30.08: this was New Vertical Maker-only ("bunlar her rol
 * görebilir bence" — it's read-only reference data, every one of the 4
 * AccessPoint roles should be able to see what they and the others can do).
 * Still gated to a known role rather than "any authenticated user", so it
 * degrades the same way the rest of the panel does if a role is ever removed.
 */
const VIEWABLE_ROLES: string[] = Object.values(ROLES);
export default async function AccessMatrixView(props: {
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
      viewType="access-matrix"
    >
      <h1>{t("accessMatrix.title")}</h1>
      {user?.role && VIEWABLE_ROLES.includes(user.role) ? (
        <AccessMatrixApp />
      ) : (
        <p className="access-matrix__error">{t("accessMatrix.forbidden")}</p>
      )}
    </DefaultTemplate>
  );
}
