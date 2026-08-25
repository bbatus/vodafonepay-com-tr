import type { CollectionConfig, Endpoint } from "payload";
import { dbLabel } from "@/lib/collectionLabels";
import { ipOf, userAgentOf } from "@/hooks/audit";

/**
 * Follow-up 25.08: "bir de feedback ver collectionu olsun … bu kimseye
 * gözükmesin sadece postgreye yazılsın."
 *
 * A one-way inbox for the people actually using this CMS to tell us what's
 * awkward about it. Deliberately not a normal, browsable collection:
 *
 * - `admin.hidden: true` — never in the sidebar, and its own
 *   /admin/collections/feedback routes 404 (Payload's List/Document views
 *   check `visibleEntities`, which excludes hidden collections).
 * - Every `access` rule is `false`, INCLUDING read and create. Nothing reaches
 *   this table through the normal REST/GraphQL surface at all; the only writer
 *   is the `/api/feedback/submit` endpoint below, which uses
 *   `overrideAccess: true`. That's what makes "sadece postgreye yazılsın"
 *   literally true rather than just visually true — a curious editor can't
 *   read other people's feedback by typing an API URL either.
 *
 * Read it with psql when you actually want to act on it:
 *   docker exec vodafonepaycms-postgres psql -U payload -d vodafonepaycms \
 *     -c "select created_at, user_email, area, message from feedback order by created_at desc;"
 */
const submitFeedbackEndpoint: Endpoint = {
  // A COLLECTION endpoint is mounted under its own slug, so this resolves to
  // `/api/feedback/submit` — not `/api/feedback/feedback/submit`. (Root-level
  // endpoints like hooks/audit.ts's `/audit/export` carry their full path
  // because they're registered on the config, not on a collection.)
  path: "/submit",
  method: "post",
  handler: async (req) => {
    if (!req.user?.id) {
      return Response.json({ errors: [{ message: "Giriş yapmalısınız." }] }, { status: 401 });
    }

    let body: { message?: string; area?: string; pagePath?: string } = {};
    try {
      if (req.json) body = await req.json();
    } catch {
      return Response.json({ errors: [{ message: "Geçersiz istek gövdesi." }] }, { status: 400 });
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return Response.json({ errors: [{ message: "Lütfen geri bildiriminizi yazın." }] }, { status: 400 });
    }

    const user = req.user as { email?: string; role?: string };
    try {
      await req.payload.create({
        collection: "feedback",
        overrideAccess: true,
        data: {
          message,
          area: typeof body.area === "string" && body.area.trim() ? body.area.trim() : undefined,
          pagePath: typeof body.pagePath === "string" ? body.pagePath : undefined,
          userEmail: user.email ?? "unknown",
          userRole: user.role,
          ip: ipOf(req),
          userAgent: userAgentOf(req),
        },
      });
    } catch (err) {
      console.error("[feedback] failed to store submission:", err);
      return Response.json({ errors: [{ message: "Geri bildirim kaydedilemedi." }] }, { status: 500 });
    }

    return Response.json({ ok: true });
  },
};

/**
 * Follow-up 25.08: "bu alana ... sadece aktif feedbacklerin sayısını tutan
 * bi şey ekleyelim ... herkes görebilir." A COUNT is not the content — it
 * can't identify who said what or reveal a single word of any message — so
 * exposing just the number doesn't compromise the "kimse görmesin" rule the
 * collection itself still enforces (`access.read: () => false` below is
 * untouched; this is a separate, narrow endpoint that only ever returns an
 * integer). Open to every authenticated role, matching "herkes görebilir".
 */
const feedbackCountEndpoint: Endpoint = {
  path: "/count",
  method: "get",
  handler: async (req) => {
    if (!req.user?.id) {
      return Response.json({ errors: [{ message: "Giriş yapmalısınız." }] }, { status: 401 });
    }
    const { totalDocs } = await req.payload.count({ collection: "feedback", overrideAccess: true });
    return Response.json({ count: totalDocs });
  },
};

export const Feedback: CollectionConfig = {
  slug: "feedback",
  labels: {
    singular: dbLabel("collectionLabel.feedback.singular", { tr: "Geri Bildirim", en: "Feedback" }),
    plural: dbLabel("collectionLabel.feedback.plural", { tr: "Geri Bildirimler", en: "Feedback" }),
  },
  endpoints: [submitFeedbackEndpoint, feedbackCountEndpoint],
  admin: {
    hideAPIURL: true,
    useAsTitle: "message",
    hidden: true,
  },
  access: {
    // See the module comment — the submit endpoint is the only writer, and
    // nothing reads this through the API at all.
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: "message", type: "textarea", required: true, label: { tr: "Geri Bildirim", en: "Feedback" } },
    { name: "area", type: "text", label: { tr: "İlgili Ekran / Bileşen", en: "Screen / Component" } },
    { name: "pagePath", type: "text", label: { tr: "Sayfa Adresi", en: "Page Path" } },
    { name: "userEmail", type: "text", required: true, label: { tr: "Kullanıcı", en: "User" } },
    { name: "userRole", type: "text", label: { tr: "Rol", en: "Role" } },
    { name: "ip", type: "text", label: "IP" },
    { name: "userAgent", type: "text", label: { tr: "Cihaz / Tarayıcı", en: "Device / Browser" } },
  ],
};
