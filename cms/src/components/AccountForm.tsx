"use client";

import { useRef, useState } from "react";
import { toast } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLE_OPTIONS } from "@/access/roles";

type AccountUser = {
  id: string | number;
  email?: string;
  role?: string;
  avatar?: { url?: string } | string | null;
  preferredLocale?: string;
};

const LOCALE_OPTIONS = [
  { label: "Türkçe", value: "tr" },
  { label: "English", value: "en" },
];

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
    setUploading(true);
    try {
      // RFP feedback 4b: upload straight to /api/media with an auto-filled
      // `alt` — Payload's admin upload drawer would otherwise force the
      // user to type alt text for what's just a profile photo.
      // Payload's REST upload endpoint only reads non-file fields from a
      // `_payload` JSON string — plain form fields (e.g. a loose "alt" key)
      // are silently ignored, which is why an earlier version of this got
      // "Lütfen geçersiz alanı düzeltin: Alt" even though `alt` was sent.
      const formData = new FormData();
      formData.append("file", file);
      formData.append("_payload", JSON.stringify({ alt: `${user.email ?? "Kullanıcı"} — profil fotoğrafı` }));
      const mediaRes = await fetch("/api/media", { method: "POST", credentials: "same-origin", body: formData });
      if (!mediaRes.ok) throw new Error(String(mediaRes.status));
      const media = await mediaRes.json();
      const mediaId = media?.doc?.id;
      const userRes = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: mediaId }),
      });
      if (!userRes.ok) throw new Error(String(userRes.status));
      setAvatarUrl(media?.doc?.url);
      toast.success(t("accountForm.avatarSaved"));
      // RFP feedback 4a: the header icon reads useAuth().user, which only
      // refreshes on a real navigation — reload is the reliable way to make
      // the new photo show up there immediately.
      window.location.reload();
    } catch {
      toast.error(t("accountForm.avatarError"));
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
      if (!res.ok) throw new Error(String(res.status));
      toast.success(t("accountForm.localeSaved"));
    } catch {
      toast.error(t("accountForm.localeError"));
    } finally {
      setSavingLocale(false);
    }
  };

  const fieldRow: React.CSSProperties = { marginBottom: "1.5rem", maxWidth: 480 };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" };
  const readOnlyValueStyle: React.CSSProperties = {
    padding: "0.6rem 0.75rem",
    border: "1px solid var(--theme-elevation-100)",
    borderRadius: "var(--style-radius-m)",
    background: "var(--theme-elevation-50)",
    color: "var(--theme-elevation-800)",
  };

  return (
    <div style={{ padding: "2rem 0", maxWidth: 640 }}>
      <div style={fieldRow}>
        <span style={labelStyle}>{t("accountForm.email")}</span>
        <div style={readOnlyValueStyle}>{user.email ?? "—"}</div>
      </div>

      <div style={fieldRow}>
        <span style={labelStyle}>{t("accountForm.role")}</span>
        <div style={readOnlyValueStyle}>{roleLabel}</div>
        <p style={{ fontSize: "0.75rem", color: "var(--theme-elevation-450)", margin: "0.35rem 0 0" }}>
          {t("accountForm.roleDescription")}
        </p>
      </div>

      <div style={fieldRow}>
        <span style={labelStyle}>{t("accountForm.avatar")}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small account-page preview, not content
            <img src={avatarUrl} alt="" width={56} height={56} style={{ borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--theme-elevation-100)",
              }}
            />
          )}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
            <p style={{ fontSize: "0.75rem", color: "var(--theme-elevation-450)", margin: "0.35rem 0 0" }}>
              {uploading ? t("accountForm.avatarUploading") : t("accountForm.avatarHint")}
            </p>
          </div>
        </div>
      </div>

      <div style={fieldRow}>
        <span style={labelStyle}>{t("accountForm.locale")}</span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={preferredLocale}
            onChange={(e) => setPreferredLocale(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid var(--theme-elevation-150)",
              borderRadius: "var(--style-radius-m)",
            }}
          >
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
        <p style={{ fontSize: "0.75rem", color: "var(--theme-elevation-450)", margin: "0.35rem 0 0" }}>
          {t("accountForm.localeDescription")}
        </p>
      </div>
    </div>
  );
}
