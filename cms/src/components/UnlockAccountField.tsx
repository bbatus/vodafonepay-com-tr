"use client";

import { useState } from "react";
import { useAuth, useField, useFormFields } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLES } from "@/access/roles";
import { describeApiError } from "@/lib/apiErrorMessage";

/**
 * RFP feedback 5.6, follow-up 25.08: "kilit açma sidebar'da ayrı bir
 * collection/ekran olmasın, Users sayfasının kendisinde olsun" — replaces
 * the old standalone /admin/locked-accounts view + sidebar entry. Overrides
 * the `lockUntil` field's own UI on the Users edit screen: shows lock state
 * plus an Unlock button right where an NV Maker is already looking at the
 * account, instead of a separate screen they'd have to navigate to.
 *
 * Unlocking still goes through Payload's own `POST /api/users/unlock`, not a
 * hand-rolled PATCH — `lockUntil`/`loginAttempts` are access.update: () =>
 * false, only the unlock operation can clear them atomically.
 * `Users.access.unlock` (isNewVerticalMaker) is the real server-side gate;
 * `canUnlock` here only decides whether to render a button that would
 * otherwise 403.
 */
export default function UnlockAccountField() {
  const { user } = useAuth();
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { value: lockUntil, setValue: setLockUntil } = useField<string>({ path: "lockUntil" });
  const { setValue: setLoginAttempts } = useField<number>({ path: "loginAttempts" });
  const email = useFormFields(([fields]) => fields.email?.value as string | undefined);
  const role = (user as { role?: string } | undefined)?.role;
  const canUnlock = role === ROLES.NEW_VERTICAL_MAKER;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isLocked = Boolean(lockUntil) && new Date(lockUntil as string) > new Date();
  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";

  const unlock = async () => {
    if (!email) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/users/unlock", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(describeApiError({ status: res.status, body, locale, context: "account" }));
      }
      setLockUntil(null);
      setLoginAttempts(0);
      setNotice(t("lockedAccounts.unlocked").replace("{email}", email));
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("lockedAccounts.unlockError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="unlock-account">
      <p className="unlock-account__status">
        {isLocked
          ? `${t("lockedAccounts.colUntil")}: ${new Date(lockUntil as string).toLocaleString(dateLocale)}`
          : t("lockedAccounts.notLocked")}
      </p>
      {notice && <p className="locked-accounts__notice">{notice}</p>}
      {error && <p className="locked-accounts__error">{error}</p>}
      {isLocked && canUnlock && (
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          disabled={busy}
          onClick={() => void unlock()}
        >
          <span className="btn__content">
            <span className="btn__label">{busy ? t("lockedAccounts.unlocking") : t("lockedAccounts.unlock")}</span>
          </span>
        </button>
      )}
    </div>
  );
}
