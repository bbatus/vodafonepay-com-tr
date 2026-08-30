import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { loadDbStrings } from "@/lib/loadDbStrings";
import GuideApp from "./GuideApp";

/**
 * Top-level "how do I use this panel" wiki — same DefaultTemplate-by-hand
 * shape as AccessMatrixView/FeedbackView (a top-level custom view gets no
 * `user` prop, only `req.user`, so the role is read off `initPageResult`).
 *
 * Unlike AccessMatrixView this has no role gate: it's onboarding content for
 * every one of the 4 roles, including the one reading it for the very first
 * time — gating it on already knowing your role would defeat the point.
 */
export default async function GuideView(props: {
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
      viewType="guide"
    >
      <h1>{t("guide.title")}</h1>
      <GuideApp />
    </DefaultTemplate>
  );
}
