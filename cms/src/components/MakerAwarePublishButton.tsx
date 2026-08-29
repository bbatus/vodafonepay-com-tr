"use client";

import { PublishButton, UnpublishButton, useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { useIsActiveCheckerDelegate } from "./useIsActiveCheckerDelegate";
import { ROLES } from "@/access/roles";

/**
 * Follow-up 28.08, from the user: "zaten maker yayınlayamıyor, yayınla
 * butonunun olmasına gerek yok — checker'da olsun sadece."
 *
 * Payload renders its Publish button for anyone with collection `update`
 * access and has no notion of our `denyMakerPublish` hook, so a Growth Maker
 * saw a normal-looking button whose only possible outcome was a 403 toast.
 * The permission was already enforced server-side; this makes the UI tell the
 * same story, replacing the dead button with the state it actually is —
 * waiting for a Checker.
 *
 * The generic counterpart to `RoleAwarePublishButton`, which stays on
 * Campaigns only: that one carries Campaigns' own reject / unpublish-request /
 * emergency-live-edit flow, all of which reads fields no other collection has.
 * This one adds nothing to Payload's own buttons — it only decides whether to
 * render them — so every other drafts-enabled collection can share it.
 *
 * An active checker delegate still gets the real button: `denyRolePublish`
 * lets a delegate publish server-side, so hiding it here would take away a
 * right they actually hold (see useIsActiveCheckerDelegate).
 */

/**
 * Follow-up 29.08: a Growth Checker could publish and then never take it back
 * down. Unpublishing is an `update`, which the Checker has — a REST PATCH of
 * `{_status:"draft"}` as the Checker returns 200 — but Payload only renders
 * its Unpublish control inside the document's ⋮ menu, and that menu is gated
 * on `hasCreatePermission || hasDeletePermission` (DocumentControls/index.js).
 * A Growth Checker has neither, by design: a Checker approves, it never
 * originates content, and delete stays with the New Vertical Maker. So the one
 * role whose whole job is controlling what is live had no way to take anything
 * off the live site — the exact inverse of the bug above, and invisible to the
 * REST audit for the same reason: the server said yes the whole time.
 *
 * This renders Payload's own `UnpublishButton` outside that menu rather than
 * reimplementing it. It already carries the confirmation modal, the minimal
 * `{_status:"draft"}` PATCH (deliberately NOT a full form submit — taking
 * content down must not be blocked by a validation error elsewhere in the
 * document, which is precisely how /aninda-bakiye became unsaveable), and the
 * version-count bookkeeping. It returns null on its own when the document
 * isn't published or the user can't publish, so it needs no guard here. Only
 * two things are ours: the label, so it reads in the admin's own language like
 * every other custom component, and the styling — Payload's markup is a
 * `PopupList.Button` built for a dropdown, restyled as a normal secondary
 * toolbar button by `.mapb-unpublish` in styles/custom.css.
 *
 * Note for anyone re-reading DocumentControls: `UnpublishButton` also requires
 * `typeof versions.drafts === "object"`, which looks like a second blocker for
 * collections declaring `drafts: true` — it isn't. Payload's config sanitize
 * rewrites `drafts: true` into an object before the client ever sees it
 * (collections/config/sanitize.js), so no collection needed changing here.
 */
export default function MakerAwarePublishButton() {
  const { user } = useAuth();
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const role = (user as { role?: string } | undefined)?.role;
  const userId = (user as { id?: string | number } | undefined)?.id;
  const isActiveDelegate = useIsActiveCheckerDelegate(role, userId);

  if (role === ROLES.GROWTH_MAKER && !isActiveDelegate) {
    return (
      <div title={t("roleAwarePublishButton.awaitingTitle")} className="rapb-awaiting">
        {t("roleAwarePublishButton.awaiting")}
      </div>
    );
  }

  return (
    <div className="mapb-actions">
      <span className="mapb-unpublish">
        <UnpublishButton label={t("makerAwarePublishButton.unpublish")} />
      </span>
      <PublishButton />
    </div>
  );
}
