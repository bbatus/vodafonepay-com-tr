import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { loadDbStrings } from "@/lib/loadDbStrings";
import FeedbackApp from "./FeedbackApp";

/**
 * Follow-up 25.08: "Geri Bildirim Gönder" screen. Same top-level-view shape as
 * AccessMatrixView (DefaultTemplate applied by hand — Payload doesn't
 * auto-wrap custom view keys). Open to every signed-in role on purpose: the
 * whole point is to hear from whoever is actually using the panel.
 */
export default async function FeedbackView(props: {
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
      viewType="feedback"
    >
      <h1>{t("feedback.title")}</h1>
      <FeedbackApp />
    </DefaultTemplate>
  );
}
