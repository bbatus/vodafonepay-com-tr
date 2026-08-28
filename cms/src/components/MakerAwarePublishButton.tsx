"use client";

import { PublishButton, useAuth } from "@payloadcms/ui";
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
 * This one adds nothing to Payload's own button — it only decides whether to
 * render it — so every other drafts-enabled collection can share it.
 *
 * An active checker delegate still gets the real button: `denyRolePublish`
 * lets a delegate publish server-side, so hiding it here would take away a
 * right they actually hold (see useIsActiveCheckerDelegate).
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

  return <PublishButton />;
}
