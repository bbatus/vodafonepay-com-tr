"use client";

import { startTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLES } from "@/access/roles";

/**
 * Follow-up 25.08: "en altta iki tane atıl duran içerik yönetimi ve ücretler
 * ve limitler var … sistem kırılımının altına getirelim."
 *
 * Payload builds its sidebar groups from each COLLECTION's `admin.group`, and
 * `afterNavLinks` components are appended after every group — there's no
 * config-level way to file a custom top-level view (Tüm İçerikler, Ücretler ve
 * Limitler, Erişim Matrisi) into an existing group, which is why they were all
 * stranded at the bottom looking unrelated to anything.
 *
 * So this renders through a portal into the target group's own
 * `.nav-group__content`. Confirmed against the live DOM: each group is
 * `<div class="nav-group …"><button class="nav-group__toggle">LABEL</button>
 * <div class="nav-group__content">…links…</div></div>`. Matching on the
 * toggle's text (against BOTH language spellings, since the admin is tr/en)
 * rather than the group's class, because the class is derived from the label
 * and a label with a space becomes two separate class tokens.
 *
 * If the target group isn't found — different Payload version, renamed group,
 * a role that can't see that group at all — this falls back to rendering in
 * place at the bottom, i.e. exactly the old behaviour. It degrades to
 * "slightly misplaced link" and never to "link disappeared".
 */
export default function GroupedNavLink({
  href,
  labelKey,
  groupNames,
  nvMakerOnly = false,
  spaced = false,
}: {
  href: string;
  /** Translations key for the link text. */
  labelKey: string;
  /** Candidate group toggle labels (tr + en) to portal into. */
  groupNames: string[];
  nvMakerOnly?: boolean;
  spaced?: boolean;
}) {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { user } = useAuth();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  /**
   * Renders nothing on the server and on the first client paint.
   *
   * Both of this component's decisions are client-only: `useAuth()`'s user
   * arrives asynchronously in the browser, and the target group can only be
   * found by looking at the real DOM. Rendering anything during SSR therefore
   * produced markup the client immediately disagreed with — confirmed live as
   * React error #418 (hydration mismatch) in the admin console, with the
   * role-gated link (Erişim Matrisi) getting dropped from the tree entirely
   * rather than just moving. Deferring the whole decision past hydration is
   * what makes the portal safe.
   */
  const [mounted, setMounted] = useState(false);

  const role = (user as { role?: string } | undefined)?.role;
  const hidden = nvMakerOnly && role !== ROLES.NEW_VERTICAL_MAKER;

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted || hidden) return;

    const find = (): HTMLElement | null => {
      for (const group of document.querySelectorAll<HTMLElement>(".nav-group")) {
        const label = group.querySelector("button")?.textContent?.trim();
        if (label && groupNames.includes(label)) {
          return group.querySelector<HTMLElement>(".nav-group__content");
        }
      }
      return null;
    };

    const found = find();
    if (found) {
      // startTransition keeps this out of the effect's synchronous body
      // (react-hooks/set-state-in-effect) — same pattern as the other
      // fetch-on-mount components in this folder.
      startTransition(() => setTarget(found));
      return;
    }

    // The nav renders progressively (and re-renders when a group is
    // collapsed/expanded), so a single synchronous lookup can miss. Watch
    // until it appears, then stop.
    const observer = new MutationObserver(() => {
      const el = find();
      if (el) {
        setTarget(el);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [groupNames, hidden, mounted]);

  if (!mounted || hidden) return null;

  const link = (
    <Link className="nav__link" href={href}>
      <span className="nav__link-label">{t(labelKey)}</span>
    </Link>
  );

  // Portalled into the group: render the bare link so it sits alongside the
  // group's own collection links and inherits their spacing.
  if (target) return createPortal(link, target);

  // Fallback: its own little block at the bottom, as before.
  return (
    <div className={`nav-group${spaced ? " nav-group--spaced" : ""}`}>
      <div className="nav-group__content">{link}</div>
    </div>
  );
}
