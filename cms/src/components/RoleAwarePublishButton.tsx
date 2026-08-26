"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth, useConfig, useDocumentInfo, useForm, useFormModified, useLocale } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLES } from "@/access/roles";

/**
 * Two RFP feedback items land here:
 *
 * 1.5 — Payload always renders the default Publish button for anyone with
 * collection `update` access, with no notion of our `denyMakerPublish`
 * beforeChange hook (Growth Maker can never set _status to "published" —
 * segregation of duties, see access/roles.ts). Without a role check here,
 * Growth Maker saw a working-looking button that always 403'd.
 *
 * 2.8 — publishing (for roles that CAN) skipped straight to live with no
 * "are you sure, here's what it'll look like" step, and re-publishing an
 * already-published, unmodified doc had no clear feedback. This replaces
 * Payload's PublishButton with a plain button + a confirm modal embedding
 * the SAME draft-mode preview iframe the "Önizleme" link uses (grabbed by
 * id from the DOM — Payload already computed and rendered that URL
 * server-side for this exact authorized user, so this reuses it rather
 * than re-deriving anything secret client-side) — only clicking "Onayla ve
 * Yayınla" inside that modal actually submits the publish.
 */
/**
 * Answers the same question `hasActiveCheckerDelegate` answers server-side
 * (access/roles.ts), via a plain REST query `users.read` is already open to —
 * this is a client component, so useAuth() only knows the session's own role.
 */
function useIsActiveCheckerDelegate(role: string | undefined, userId: string | number | undefined): boolean {
  const [isActiveDelegate, setIsActiveDelegate] = useState(false);

  useEffect(() => {
    if (role !== ROLES.GROWTH_MAKER || !userId) return;
    const params = new URLSearchParams({
      limit: "1",
      depth: "0",
      "where[and][0][delegateTo][equals]": String(userId),
      "where[and][1][role][in][0]": ROLES.NEW_VERTICAL_CHECKER,
      "where[and][1][role][in][1]": ROLES.GROWTH_CHECKER,
      "where[and][2][or][0][delegationExpiresAt][exists]": "false",
      "where[and][2][or][1][delegationExpiresAt][greater_than]": new Date().toISOString(),
    });
    let cancelled = false;
    fetch(`/api/users?${params.toString()}`, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setIsActiveDelegate((data?.totalDocs ?? 0) > 0);
      })
      .catch(() => {
        if (!cancelled) setIsActiveDelegate(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, userId]);

  return isActiveDelegate;
}

/** Stops the admin page behind an open modal from scrolling under the pointer. */
function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

export default function RoleAwarePublishButton() {
  const { user } = useAuth();
  const locale = useAdminLocale();
  const tt = useDbStrings(locale);
  const t = {
    publish: tt("roleAwarePublishButton.publish"),
    publishing: tt("roleAwarePublishButton.publishing"),
    already: tt("roleAwarePublishButton.already"),
    heading: tt("roleAwarePublishButton.heading"),
    body: tt("roleAwarePublishButton.body"),
    noPreview: tt("roleAwarePublishButton.noPreview"),
    cancel: tt("roleAwarePublishButton.cancel"),
    confirm: tt("roleAwarePublishButton.confirm"),
    awaiting: tt("roleAwarePublishButton.awaiting"),
    awaitingTitle: tt("roleAwarePublishButton.awaitingTitle"),
    reject: tt("roleAwarePublishButton.reject"),
    rejecting: tt("roleAwarePublishButton.rejecting"),
    rejectHeading: tt("roleAwarePublishButton.rejectHeading"),
    rejectBody: tt("roleAwarePublishButton.rejectBody"),
    rejectReasonLabel: tt("roleAwarePublishButton.rejectReasonLabel"),
    rejectReasonPlaceholder: tt("roleAwarePublishButton.rejectReasonPlaceholder"),
    rejectReasonRequired: tt("roleAwarePublishButton.rejectReasonRequired"),
    rejectConfirm: tt("roleAwarePublishButton.rejectConfirm"),
    liveNotice: tt("roleAwarePublishButton.liveNotice"),
    unpublish: tt("roleAwarePublishButton.unpublish"),
    unpublishing: tt("roleAwarePublishButton.unpublishing"),
    requestUnpublish: tt("roleAwarePublishButton.requestUnpublish"),
    unpublishRequested: tt("roleAwarePublishButton.unpublishRequested"),
    previewDesktop: tt("roleAwarePublishButton.previewDesktop"),
    previewMobile: tt("roleAwarePublishButton.previewMobile"),
    previewWidthGroup: tt("roleAwarePublishButton.previewWidthGroup"),
    previewFrameTitle: tt("roleAwarePublishButton.previewFrameTitle"),
    forceEdit: tt("roleAwarePublishButton.forceEdit"),
    forceEditing: tt("roleAwarePublishButton.forceEditing"),
    forceHeading: tt("roleAwarePublishButton.forceHeading"),
    forceBody: tt("roleAwarePublishButton.forceBody"),
    forceAck: tt("roleAwarePublishButton.forceAck"),
    forceConfirm: tt("roleAwarePublishButton.forceConfirm"),
    forceRecommended: tt("roleAwarePublishButton.forceRecommended"),
    submitFailed: tt("roleAwarePublishButton.submitFailed"),
  };
  const role = (user as { role?: string } | undefined)?.role;
  const userId = (user as { id?: string | number } | undefined)?.id;

  // RFP §3.1 delegation: the segregation-of-duties branch below (`role ===
  // ROLES.GROWTH_MAKER`) used to be unconditional, so a Growth Maker
  // standing in as an active checker delegate — already allowed to publish
  // server-side, see denyRolePublish's hasActiveCheckerDelegate bypass in
  // access/roles.ts — still only ever saw the Maker's "submit for review"
  // view here and had no actual way to click Publish. This component is a
  // client component (useAuth() only knows the session's own role), so it
  // asks the same question hasActiveCheckerDelegate answers server-side, via
  // a plain REST query users.read is already open to (`read: authenticated`
  // in Users.ts) — no dedicated endpoint needed.
  const isActiveDelegate = useIsActiveCheckerDelegate(role, userId);

  const { id, collectionSlug, globalSlug, hasPublishedDoc, setHasPublishedDoc, setMostRecentVersionIsAutosaved, setUnpublishedVersionCount, unpublishedVersionCount } =
    useDocumentInfo();
  const { submit } = useForm();
  const modified = useFormModified();
  const { code: localeCode } = useLocale();
  const { config } = useConfig();

  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  // Follow-up 25.08: a failed submit used to just close the modal with no
  // explanation ("ekstra feedback verdim o da gitmiyor galiba") — Payload's
  // own toast fires for some failures but not for a validation 400 raised
  // from inside our own hooks. Keep the modal open and say what happened.
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [showForceConfirm, setShowForceConfirm] = useState(false);
  const [forceAck, setForceAck] = useState(false);
  const [forcing, setForcing] = useState(false);

  // RFP feedback: the confirm-before-publish modal's iframe was stuck at its
  // 420px minHeight (a flex:1 child can't grow inside a column whose own
  // height is unconstrained — only maxHeight was set) so the preview showed
  // mostly the site's header/nav/app-download banner, with the actual
  // campaign content scrolled out of view. Scrolling over the iframe also
  // scrolled the admin page behind the modal instead, since nothing locked
  // background scroll while a modal was open. Fixing both: give the modal a
  // real height so the iframe actually fills it, and lock body scroll while
  // either modal is open.
  const modalOpen = confirming || showRejectForm || showForceConfirm;
  useLockBodyScroll(modalOpen);

  // Mirrors Payload's own PublishButton canPublish check (minus upload-status
  // and scheduled-publish edge cases this collection doesn't use).
  const canPublish = modified || (unpublishedVersionCount ?? 0) > 0 || !hasPublishedDoc;

  const doPublish = useCallback(async () => {
    setPublishing(true);
    try {
      const params = new URLSearchParams({ depth: "0", locale: localeCode || "" }).toString();
      const idSegment = id ? `/${id}` : "";
      const path = globalSlug ? `/globals/${globalSlug}` : `/${collectionSlug}${idSegment}`;
      const action = formatAdminURL({ apiRoute: config.routes.api, path: `${path}?${params}` as `/${string}` });
      const result = await submit({ action, overrides: { _status: "published" } });
      if (result) {
        setUnpublishedVersionCount(0);
        setMostRecentVersionIsAutosaved(false);
        setHasPublishedDoc(true);
      }
    } finally {
      setPublishing(false);
      setConfirming(false);
    }
  }, [
    collectionSlug,
    config.routes.api,
    globalSlug,
    id,
    localeCode,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    submit,
  ]);

  /**
   * Follow-up 25.08 — the "acil düzeltme" path. The unpublish-first flow is
   * still what LiveActions offers first; this is the second, explicitly
   * acknowledged confirmation the request asked for. `forceLiveEdit` is what
   * Campaigns.ts's guardPublishedEdit checks (and audits) server-side — the
   * checkbox in the modal only decides whether we send it.
   */
  const doForceLiveEdit = useCallback(async () => {
    setForcing(true);
    try {
      const params = new URLSearchParams({ depth: "0", locale: localeCode || "" }).toString();
      const idSegment = id ? `/${id}` : "";
      const path = `/${collectionSlug}${idSegment}`;
      const action = formatAdminURL({ apiRoute: config.routes.api, path: `${path}?${params}` as `/${string}` });
      const result = await submit({ action, overrides: { forceLiveEdit: true, _status: "published" } });
      if (result && typeof window !== "undefined") window.location.reload();
    } finally {
      setForcing(false);
      setShowForceConfirm(false);
      setForceAck(false);
    }
  }, [collectionSlug, config.routes.api, id, localeCode, submit]);

  const doReject = useCallback(async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    setRejectError(null);
    try {
      const params = new URLSearchParams({ depth: "0", locale: localeCode || "" }).toString();
      const idSegment = id ? `/${id}` : "";
      const path = `/${collectionSlug}${idSegment}`;
      const action = formatAdminURL({ apiRoute: config.routes.api, path: `${path}?${params}` as `/${string}` });
      const result = await submit({
        action,
        overrides: {
          reviewStatus: "rejected",
          rejectionReason: rejectReason.trim(),
          rejectedAt: new Date().toISOString(),
          rejectedBy: (user as { id?: string | number } | undefined)?.id,
        },
      });
      if (result && typeof window !== "undefined") {
        window.location.reload();
        return;
      }
      // Submit came back falsy — the save was rejected (validation/permission).
      // Keep the modal and the typed reason so the editor doesn't lose it.
      setRejectError(t.submitFailed);
    } finally {
      setRejecting(false);
    }
  }, [collectionSlug, config.routes.api, id, localeCode, rejectReason, submit, t.submitFailed, user]);

  /**
   * RFP feedback 5.4: a live campaign can't be edited in place — the server
   * rejects any content change while `_status` is "published" (see
   * guardPublishedEdit in collections/Campaigns.ts). This is the way OUT of
   * that state, so an editor gets a route forward instead of an error.
   *
   * Roles that can publish can also unpublish directly; Growth Maker can only
   * ask, and a Checker approving the request is what performs the unpublish.
   * Both go through the same form submit, so the server hook is what actually
   * decides — this only picks which button to show.
   */
  const doUnpublish = useCallback(
    async (request: boolean) => {
      setUnpublishing(true);
      try {
        const params = new URLSearchParams({ depth: "0", locale: localeCode || "" }).toString();
        const idSegment = id ? `/${id}` : "";
        const path = `/${collectionSlug}${idSegment}`;
        const action = formatAdminURL({ apiRoute: config.routes.api, path: `${path}?${params}` as `/${string}` });
        const overrides = request
          ? { unpublishRequest: "pending", unpublishRequestedBy: userId, unpublishRequestedAt: new Date().toISOString() }
          : { _status: "draft" };
        const result = await submit({ action, overrides });
        if (result && typeof window !== "undefined") window.location.reload();
      } finally {
        setUnpublishing(false);
      }
    },
    [collectionSlug, config.routes.api, id, localeCode, submit, userId]
  );

  if (role === ROLES.GROWTH_MAKER && !isActiveDelegate) {
    if (hasPublishedDoc) {
      return (
        <LiveActions
          t={t}
          unpublishing={unpublishing}
          label={unpublishing ? t.unpublishing : t.requestUnpublish}
          onClick={() => void doUnpublish(true)}
        />
      );
    }
    return <AwaitingNotice t={t} />;
  }

  const previewHref =
    typeof document !== "undefined" ? document.getElementById("preview-button")?.getAttribute("href") : null;

  // RFP feedback 5.4: for roles that CAN unpublish, this is the whole flow —
  // take it off the air (which sends it back to "İncelemede"), edit, republish.
  if (hasPublishedDoc && !modified) {
    return (
      <LiveActions
        t={t}
        unpublishing={unpublishing}
        label={unpublishing ? t.unpublishing : t.unpublish}
        onClick={() => void doUnpublish(false)}
      />
    );
  }

  // Follow-up 25.08 — see LiveEditedActions for why this branch exists.
  if (hasPublishedDoc && modified) {
    return (
      <LiveEditedActions
        t={t}
        unpublishing={unpublishing}
        onUnpublish={() => void doUnpublish(false)}
        showForceConfirm={showForceConfirm}
        setShowForceConfirm={setShowForceConfirm}
        forceAck={forceAck}
        setForceAck={setForceAck}
        forcing={forcing}
        onForceConfirm={doForceLiveEdit}
      />
    );
  }

  return (
    <>
      <PublishActionsBar
        t={t}
        showRejectButton={!hasPublishedDoc}
        canPublish={canPublish}
        onReject={() => setShowRejectForm(true)}
        onPublish={() => setConfirming(true)}
      />

      {showRejectForm && (
        <RejectModal
          t={t}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          rejecting={rejecting}
          error={rejectError}
          onCancel={() => {
            setShowRejectForm(false);
            setRejectReason("");
            setRejectError(null);
          }}
          onConfirm={doReject}
        />
      )}

      {confirming && (
        <ConfirmPublishModal
          t={t}
          previewHref={previewHref}
          publishing={publishing}
          onCancel={() => setConfirming(false)}
          onConfirm={doPublish}
        />
      )}
    </>
  );
}

type ButtonStrings = Record<
  | "publish"
  | "publishing"
  | "already"
  | "heading"
  | "body"
  | "noPreview"
  | "cancel"
  | "confirm"
  | "awaiting"
  | "awaitingTitle"
  | "reject"
  | "rejecting"
  | "rejectHeading"
  | "rejectBody"
  | "rejectReasonLabel"
  | "rejectReasonPlaceholder"
  | "rejectReasonRequired"
  | "rejectConfirm"
  | "liveNotice"
  | "unpublish"
  | "unpublishing"
  | "requestUnpublish"
  | "unpublishRequested"
  | "previewDesktop"
  | "previewMobile"
  | "previewWidthGroup"
  | "previewFrameTitle"
  | "forceEdit"
  | "forceEditing"
  | "forceHeading"
  | "forceBody"
  | "forceAck"
  | "forceConfirm"
  | "forceRecommended"
  | "submitFailed",
  string
>;

function PublishActionsBar({
  t,
  showRejectButton,
  canPublish,
  onReject,
  onPublish,
}: {
  t: ButtonStrings;
  showRejectButton: boolean;
  canPublish: boolean;
  onReject: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="rapb-actions-bar">
      {showRejectButton && (
        <button type="button" className="btn btn--style-secondary btn--size-medium" onClick={onReject}>
          <span className="btn__content">
            <span className="btn__label">{t.reject}</span>
          </span>
        </button>
      )}
      <button
        type="button"
        className={`btn btn--style-primary btn--size-medium${!canPublish ? " btn--disabled" : ""}`}
        disabled={!canPublish}
        title={!canPublish ? t.already : undefined}
        onClick={onPublish}
      >
        <span className="btn__content">
          <span className="btn__label">{t.publish}</span>
        </span>
      </button>
    </div>
  );
}

function LiveActions({
  t,
  unpublishing,
  label,
  onClick,
}: {
  t: ButtonStrings;
  unpublishing: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="vf-live-actions">
      <span className="vf-live-actions__notice">{t.liveNotice}</span>
      <button
        type="button"
        className={`btn btn--style-secondary btn--size-medium${unpublishing ? " btn--disabled" : ""}`}
        disabled={unpublishing}
        onClick={onClick}
      >
        <span className="btn__content">
          <span className="btn__label">{label}</span>
        </span>
      </button>
    </div>
  );
}

/**
 * A LIVE document that's been edited in the form. The server rejects a plain
 * publish here (guardPublishedEdit), so both real routes are offered instead
 * of a Publish button that could only ever 409: the recommended
 * unpublish-first flow, and the acknowledged emergency one.
 */
function LiveEditedActions({
  t,
  unpublishing,
  onUnpublish,
  showForceConfirm,
  setShowForceConfirm,
  forceAck,
  setForceAck,
  forcing,
  onForceConfirm,
}: {
  t: ButtonStrings;
  unpublishing: boolean;
  onUnpublish: () => void;
  showForceConfirm: boolean;
  setShowForceConfirm: (value: boolean) => void;
  forceAck: boolean;
  setForceAck: (value: boolean) => void;
  forcing: boolean;
  onForceConfirm: () => void;
}) {
  return (
    <>
      <div className="vf-live-actions vf-live-actions--urgent">
        <span className="vf-live-actions__notice">{t.forceRecommended}</span>
        <button
          type="button"
          className={`btn btn--style-secondary btn--size-medium${unpublishing ? " btn--disabled" : ""}`}
          disabled={unpublishing}
          onClick={onUnpublish}
        >
          <span className="btn__content">
            <span className="btn__label">{unpublishing ? t.unpublishing : t.unpublish}</span>
          </span>
        </button>
        <button type="button" className="btn btn--style-primary btn--size-medium" onClick={() => setShowForceConfirm(true)}>
          <span className="btn__content">
            <span className="btn__label">{t.forceEdit}</span>
          </span>
        </button>
      </div>

      {showForceConfirm && (
        <ForceLiveEditModal
          t={t}
          ack={forceAck}
          setAck={setForceAck}
          forcing={forcing}
          onCancel={() => {
            setShowForceConfirm(false);
            setForceAck(false);
          }}
          onConfirm={onForceConfirm}
        />
      )}
    </>
  );
}

function AwaitingNotice({ t }: { t: ButtonStrings }) {
  return (
    <div title={t.awaitingTitle} className="rapb-awaiting">
      {t.awaiting}
    </div>
  );
}

function RejectModal({
  t,
  rejectReason,
  setRejectReason,
  rejecting,
  error,
  onCancel,
  onConfirm,
}: {
  t: ButtonStrings;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  rejecting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rapb-modal-overlay">
      <div className="rapb-modal">
        <div>
          <p className="rapb-modal-title">{t.rejectHeading}</p>
          <p className="rapb-modal-subtitle">{t.rejectBody}</p>
        </div>
        <label className="rapb-field">
          <span className="rapb-field-label">{t.rejectReasonLabel}</span>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t.rejectReasonPlaceholder}
            rows={4}
            className="rapb-textarea"
          />
          {!rejectReason.trim() && <span className="rapb-field-error">{t.rejectReasonRequired}</span>}
        </label>
        {error && <p className="rapb-submit-error">{error}</p>}
        <div className="rapb-modal-actions">
          <button type="button" className="btn btn--style-secondary btn--size-medium" disabled={rejecting} onClick={onCancel}>
            <span className="btn__content">
              <span className="btn__label">{t.cancel}</span>
            </span>
          </button>
          <button
            type="button"
            className={`btn btn--style-primary btn--size-medium${rejecting || !rejectReason.trim() ? " btn--disabled" : ""}`}
            disabled={rejecting || !rejectReason.trim()}
            onClick={onConfirm}
          >
            <span className="btn__content">
              <span className="btn__label">{rejecting ? t.rejecting : t.rejectConfirm}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Follow-up 25.08: the second confirmation for skipping review on a live
 * campaign. Deliberately NOT a one-click button — the checkbox is what makes
 * this a conscious decision rather than a faster default, which is the whole
 * point of keeping the unpublish-first flow as the recommended route.
 */
function ForceLiveEditModal({
  t,
  ack,
  setAck,
  forcing,
  onCancel,
  onConfirm,
}: {
  t: ButtonStrings;
  ack: boolean;
  setAck: (value: boolean) => void;
  forcing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rapb-modal-overlay">
      <div className="rapb-modal">
        <div>
          <p className="rapb-modal-title">{t.forceHeading}</p>
          <p className="rapb-modal-subtitle">{t.forceBody}</p>
        </div>
        <label className="rapb-ack">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          <span>{t.forceAck}</span>
        </label>
        <div className="rapb-modal-actions">
          <button type="button" className="btn btn--style-secondary btn--size-medium" disabled={forcing} onClick={onCancel}>
            <span className="btn__content">
              <span className="btn__label">{t.cancel}</span>
            </span>
          </button>
          <button
            type="button"
            className={`btn btn--style-primary btn--size-medium${!ack || forcing ? " btn--disabled" : ""}`}
            disabled={!ack || forcing}
            onClick={onConfirm}
          >
            <span className="btn__content">
              <span className="btn__label">{forcing ? t.forceEditing : t.forceConfirm}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmPublishModal({
  t,
  previewHref,
  publishing,
  onCancel,
  onConfirm,
}: {
  t: ButtonStrings;
  previewHref: string | null | undefined;
  publishing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // RFP §3.2.12: "System should provide design review capability for both
  // mobile and desktop view while or after design" — the confirm-before-
  // publish preview used to be one fixed-width iframe. `width: 100%` (the
  // iframe's own CSS) already makes "desktop" mean "as wide as the modal";
  // "mobile" just caps that same iframe to a phone-width column instead of
  // rendering a second iframe, so there's only ever one live preview to
  // load per view rather than two.
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="rapb-modal-overlay rapb-modal-overlay--confirm">
      <div className="rapb-modal rapb-modal--confirm">
        <div className="rapb-confirm-head">
          <p className="rapb-confirm-heading">{t.heading}</p>
          <p className="rapb-confirm-body">{t.body}</p>
          {previewHref && (
            <fieldset className="rapb-preview-toggle" aria-label={t.previewWidthGroup}>
              <button
                type="button"
                className={`rapb-preview-toggle__btn${previewWidth === "desktop" ? " rapb-preview-toggle__btn--active" : ""}`}
                aria-pressed={previewWidth === "desktop"}
                onClick={() => setPreviewWidth("desktop")}
              >
                {t.previewDesktop}
              </button>
              <button
                type="button"
                className={`rapb-preview-toggle__btn${previewWidth === "mobile" ? " rapb-preview-toggle__btn--active" : ""}`}
                aria-pressed={previewWidth === "mobile"}
                onClick={() => setPreviewWidth("mobile")}
              >
                {t.previewMobile}
              </button>
            </fieldset>
          )}
        </div>

        {previewHref ? (
          <div className={`rapb-preview-frame${previewWidth === "mobile" ? " rapb-preview-frame--mobile" : ""}`}>
            <iframe src={previewHref} title={t.previewFrameTitle} className="rapb-preview-iframe" />
          </div>
        ) : (
          <p className="rapb-no-preview">{t.noPreview}</p>
        )}

        <div className="rapb-modal-actions rapb-modal-actions--fixed">
          <button type="button" className="btn btn--style-secondary btn--size-medium" disabled={publishing} onClick={onCancel}>
            <span className="btn__content">
              <span className="btn__label">{t.cancel}</span>
            </span>
          </button>
          <button
            type="button"
            className={`btn btn--style-primary btn--size-medium${publishing ? " btn--disabled" : ""}`}
            disabled={publishing}
            onClick={onConfirm}
          >
            <span className="btn__content">
              <span className="btn__label">{publishing ? t.publishing : t.confirm}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
