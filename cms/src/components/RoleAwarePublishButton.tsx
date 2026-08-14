"use client";

import { useCallback, useState } from "react";
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
  };
  const role = (user as { role?: string } | undefined)?.role;

  const { id, collectionSlug, globalSlug, hasPublishedDoc, setHasPublishedDoc, setMostRecentVersionIsAutosaved, setUnpublishedVersionCount, unpublishedVersionCount } =
    useDocumentInfo();
  const { submit } = useForm();
  const modified = useFormModified();
  const { code: localeCode } = useLocale();
  const { config } = useConfig();

  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Mirrors Payload's own PublishButton canPublish check (minus upload-status
  // and scheduled-publish edge cases this collection doesn't use).
  const canPublish = modified || (unpublishedVersionCount ?? 0) > 0 || !hasPublishedDoc;

  const doPublish = useCallback(async () => {
    setPublishing(true);
    try {
      const params = new URLSearchParams({ depth: "0", locale: localeCode || "" }).toString();
      const path = globalSlug ? `/globals/${globalSlug}` : `/${collectionSlug}${id ? `/${id}` : ""}`;
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

  const doReject = useCallback(async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      const params = new URLSearchParams({ depth: "0", locale: localeCode || "" }).toString();
      const path = `/${collectionSlug}${id ? `/${id}` : ""}`;
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
      }
    } finally {
      setRejecting(false);
      setShowRejectForm(false);
      setRejectReason("");
    }
  }, [collectionSlug, config.routes.api, id, localeCode, rejectReason, submit, user]);

  if (role === ROLES.GROWTH_MAKER) {
    return (
      <div
        title={t.awaitingTitle}
        style={{
          padding: "0.5rem 0.8rem",
          fontSize: "0.8rem",
          color: "var(--theme-elevation-450)",
          border: "1px dashed var(--theme-elevation-200)",
          borderRadius: "var(--style-radius-s)",
          whiteSpace: "nowrap",
        }}
      >
        {t.awaiting}
      </div>
    );
  }

  const previewHref =
    typeof document !== "undefined" ? document.getElementById("preview-button")?.getAttribute("href") : null;

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {!hasPublishedDoc && (
          <button
            type="button"
            className="btn btn--style-secondary btn--size-medium"
            onClick={() => setShowRejectForm(true)}
          >
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
          onClick={() => setConfirming(true)}
        >
          <span className="btn__content">
            <span className="btn__label">{t.publish}</span>
          </span>
        </button>
      </div>

      {showRejectForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "var(--style-radius-l)",
              padding: "1.5rem",
              width: "min(480px, 100%)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: "1.1rem", margin: 0 }}>{t.rejectHeading}</p>
              <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{t.rejectBody}</p>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.rejectReasonLabel}</span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t.rejectReasonPlaceholder}
                rows={4}
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1px solid var(--theme-elevation-150)",
                  borderRadius: "var(--style-radius-m)",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                }}
              />
              {!rejectReason.trim() && (
                <span style={{ fontSize: "0.75rem", color: "var(--theme-error-500)" }}>{t.rejectReasonRequired}</span>
              )}
            </label>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn--style-secondary btn--size-medium"
                disabled={rejecting}
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
              >
                <span className="btn__content">
                  <span className="btn__label">{t.cancel}</span>
                </span>
              </button>
              <button
                type="button"
                className={`btn btn--style-primary btn--size-medium${rejecting || !rejectReason.trim() ? " btn--disabled" : ""}`}
                disabled={rejecting || !rejectReason.trim()}
                onClick={doReject}
              >
                <span className="btn__content">
                  <span className="btn__label">{rejecting ? t.rejecting : t.rejectConfirm}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "var(--style-radius-l)",
              padding: "1.5rem",
              width: "min(960px, 100%)",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: "1.1rem", margin: 0 }}>{t.heading}</p>
              <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{t.body}</p>
            </div>

            {previewHref ? (
              <iframe
                src={previewHref}
                title="preview"
                style={{ flex: 1, minHeight: 420, border: "1px solid var(--theme-elevation-150)", borderRadius: "var(--style-radius-m)" }}
              />
            ) : (
              <p style={{ color: "var(--theme-elevation-450)" }}>{t.noPreview}</p>
            )}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn--style-secondary btn--size-medium"
                disabled={publishing}
                onClick={() => setConfirming(false)}
              >
                <span className="btn__content">
                  <span className="btn__label">{t.cancel}</span>
                </span>
              </button>
              <button
                type="button"
                className={`btn btn--style-primary btn--size-medium${publishing ? " btn--disabled" : ""}`}
                disabled={publishing}
                onClick={doPublish}
              >
                <span className="btn__content">
                  <span className="btn__label">{publishing ? t.publishing : t.confirm}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
