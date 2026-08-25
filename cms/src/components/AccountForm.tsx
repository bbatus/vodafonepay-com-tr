"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLE_OPTIONS } from "@/access/roles";
import { describeApiError } from "@/lib/apiErrorMessage";

type AccountUser = {
  id: string | number;
  email?: string;
  username?: string;
  role?: string;
  avatar?: { url?: string } | string | null;
  preferredLocale?: string;
};

const LOCALE_OPTIONS = [
  { label: "Türkçe", value: "tr" },
  { label: "English", value: "en" },
];

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * RFP feedback 4a-4f, client half of CustomAccountView.tsx. A deliberately
 * plain fetch-based form (same pattern as ContentManagementApp.tsx) rather
 * than Payload's Form/field machinery — email and role are rendered as
 * static text (not inputs) because that's the only way to make "read-only"
 * visually unambiguous; a disabled-but-still-a-dropdown control still reads
 * as "maybe I can change this."
 */
export default function AccountForm({ user }: { user: AccountUser }) {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);

  const initialAvatarUrl = user.avatar && typeof user.avatar === "object" ? user.avatar.url : undefined;
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preferredLocale, setPreferredLocale] = useState(user.preferredLocale ?? "tr");
  const [savingLocale, setSavingLocale] = useState(false);

  const roleLabel = ROLE_OPTIONS.find((opt) => opt.value === user.role)?.label ?? user.role ?? "—";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side pre-validation — same limits the /api/users/me/avatar
    // endpoint itself enforces, checked here first so a Checker doesn't
    // wait on a round-trip just to get told their file is too big/wrong type.
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(`Profil fotoğrafı ${AVATAR_MAX_BYTES / (1024 * 1024)}MB'den küçük olmalı.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!AVATAR_MIME_TYPES.has(file.type)) {
      toast.error("Sadece JPEG, PNG, WebP veya GIF yükleyebilirsiniz.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      // RFP feedback B1: mediaCreate is Maker-only, so a Checker POSTing
      // straight to /api/media gets a 403 — this dedicated endpoint
      // (cms/src/collections/Users.ts) uploads with overrideAccess and
      // attaches the result to ONLY the caller's own avatar field, so every
      // role can set their own profile photo without widening mediaCreate.
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/users/me/avatar", { method: "POST", credentials: "same-origin", body: formData });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(describeApiError({ status: res.status, body, locale, context: "account" }));
      }
      const updatedAvatar = body?.doc?.avatar;
      setAvatarUrl(typeof updatedAvatar === "object" ? updatedAvatar?.url : undefined);
      toast.success(t("accountForm.avatarSaved"));
      // RFP feedback 4a: the header icon reads useAuth().user, which only
      // refreshes on a real navigation — reload is the reliable way to make
      // the new photo show up there immediately.
      window.location.reload();
    } catch (err) {
      // Real server-side error message (size/mime/db failure) instead of a
      // generic toast — RFP feedback explicitly asked for this.
      toast.error(err instanceof Error && err.message ? err.message : describeApiError({ err, locale, context: "account" }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveLocale = async () => {
    setSavingLocale(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLocale }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(describeApiError({ status: res.status, body: errBody, locale, context: "account" }));
      }
      toast.success(t("accountForm.localeSaved"));
      // This PATCH goes straight to the REST API, not through Payload's
      // Form machinery, so useAuth()'s cached user never learns
      // preferredLocale changed — LocalePreferenceSync (which reacts to that
      // value) would then sit stale until some unrelated navigation happened
      // to refetch it. Same fix as the avatar save above: set the cookie
      // Payload's i18n actually reads and reload immediately, so the new
      // language takes effect right here instead of requiring a manual F5.
      document.cookie = `payload-lng=${preferredLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : t("accountForm.localeError"));
    } finally {
      setSavingLocale(false);
    }
  };

  return (
    <div className="account-form">
      <div className="field-type account-form__field">
        <span className="field-label">{t("accountForm.email")}</span>
        <div className="account-form__readonly-value">{user.email ?? "—"}</div>
      </div>

      <div className="field-type account-form__field">
        <span className="field-label">{t("accountForm.username")}</span>
        <div className="account-form__readonly-value">{user.username ?? "—"}</div>
      </div>

      <div className="field-type account-form__field">
        <span className="field-label">{t("accountForm.role")}</span>
        <div className="account-form__readonly-value">{roleLabel}</div>
        <p className="field-description">{t("accountForm.roleDescription")}</p>
      </div>

      <div className="field-type account-form__field">
        <span className="field-label">{t("accountForm.avatar")}</span>
        <div className="account-form__avatar-row">
          <button
            type="button"
            className="account-form__avatar-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label={t("accountForm.avatarHint")}
            title={t("accountForm.avatarHint")}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- small account-page preview, not content
              <img src={avatarUrl} alt="" width={56} height={56} className="account-form__avatar-image" />
            ) : (
              <div className="account-form__avatar-placeholder" />
            )}
            <span className="account-form__avatar-overlay" aria-hidden="true">
              ✎
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploading}
            className="account-form__avatar-input"
            aria-hidden="true"
            tabIndex={-1}
          />
          <p className="field-description">{uploading ? t("accountForm.avatarUploading") : t("accountForm.avatarHint")}</p>
        </div>
      </div>

      <div className="field-type account-form__field">
        <span className="field-label">{t("accountForm.locale")}</span>
        <div className="account-form__locale-row">
          <select value={preferredLocale} onChange={(e) => setPreferredLocale(e.target.value)}>
            {LOCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`btn btn--style-primary btn--size-medium${savingLocale || preferredLocale === (user.preferredLocale ?? "tr") ? " btn--disabled" : ""}`}
            disabled={savingLocale || preferredLocale === (user.preferredLocale ?? "tr")}
            onClick={() => void saveLocale()}
          >
            <span className="btn__content">
              <span className="btn__label">{t("accountForm.save")}</span>
            </span>
          </button>
        </div>
        <p className="field-description">{t("accountForm.localeDescription")}</p>
      </div>

      <div className="account-form__field">
        <Link href="/admin/logout" className="btn btn--style-secondary btn--size-medium">
          <span className="btn__content">
            <span className="btn__label">{t("accountForm.logout")}</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
