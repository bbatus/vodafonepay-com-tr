"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLES } from "@/access/roles";
import { describeApiError } from "@/lib/apiErrorMessage";

type LockedUser = {
  id: string | number;
  email: string;
  role?: string;
  lockUntil?: string | null;
  loginAttempts?: number | null;
};

/**
 * RFP feedback 5.6 — "test-nv-maker kişiler hesap kilidi olan kişileri
 * görebilmeli … o kişinin kilidini kaldırabilmeli".
 *
 * Unlocking goes through Payload's own `POST /api/users/unlock`, not a
 * hand-rolled PATCH: `loginAttempts`/`lockUntil` are declared with
 * `access.update: () => false`, so nothing can write them directly, and the
 * unlock operation is the only path that also resets the attempt counter
 * atomically. `Users.access.unlock` (isNewVerticalMaker) is what actually
 * enforces the role — the role check below only decides whether to render a
 * button that would otherwise 403.
 */
export default function LockedAccountsApp() {
  const { user } = useAuth();
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const role = (user as { role?: string } | undefined)?.role;
  const canUnlock = role === ROLES.NEW_VERTICAL_MAKER;

  const [users, setUsers] = useState<LockedUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // `lockUntil` in the past means the lock has already expired on its
      // own — Payload clears it lazily on the next login attempt, so filter
      // by "still in the future" rather than "field is set", otherwise this
      // screen shows stale locks nobody needs to act on.
      const params = new URLSearchParams({
        limit: "200",
        depth: "0",
        sort: "-lockUntil",
        "where[lockUntil][greater_than]": new Date().toISOString(),
      });
      const res = await fetch(`/api/users?${params.toString()}`, { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(describeApiError({ status: res.status, body, locale, context: "account" }));
      }
      const data = (await res.json()) as { docs?: LockedUser[] };
      setUsers(data.docs ?? []);
    } catch (err) {
      setUsers([]);
      setError(err instanceof Error && err.message ? err.message : t("lockedAccounts.loadError"));
    }
  }, [t, locale]);

  useEffect(() => {
  // startTransition keeps the first setState out of the effect's synchronous
  // body (react-hooks/set-state-in-effect) — a plain `void load()` here
  // triggers a cascading render on every dependency change.
    startTransition(() => {
      void load();
    });
  }, [load]);

  const unlock = async (email: string) => {
    setBusyEmail(email);
    setNotice(null);
    setError(null);
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
      setNotice(t("lockedAccounts.unlocked").replace("{email}", email));
      await load();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("lockedAccounts.unlockError"));
    } finally {
      setBusyEmail(null);
    }
  };

  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";

  let body: React.ReactNode;
  if (users === null) {
    body = <p className="locked-accounts__hint">{t("lockedAccounts.loading")}</p>;
  } else if (users.length === 0) {
    body = <p className="locked-accounts__hint">{t("lockedAccounts.empty")}</p>;
  } else {
    body = (
      <div className="table-wrap">
        <table className="locked-accounts__table">
          <thead>
            <tr>
              <th>{t("lockedAccounts.colEmail")}</th>
              <th>{t("lockedAccounts.colUntil")}</th>
              <th>{t("lockedAccounts.colAttempts")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((locked) => (
              <tr key={String(locked.id)}>
                <td>
                  <Link href={`/admin/collections/users/${String(locked.id)}`}>{locked.email}</Link>
                </td>
                <td>{locked.lockUntil ? new Date(locked.lockUntil).toLocaleString(dateLocale) : "—"}</td>
                <td>{locked.loginAttempts ?? 0}</td>
                <td className="locked-accounts__actions">
                  {canUnlock && (
                    <button
                      type="button"
                      className="btn btn--style-secondary btn--size-small"
                      disabled={busyEmail === locked.email}
                      onClick={() => unlock(locked.email)}
                    >
                      <span className="btn__content">
                        <span className="btn__label">
                          {busyEmail === locked.email ? t("lockedAccounts.unlocking") : t("lockedAccounts.unlock")}
                        </span>
                      </span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="locked-accounts">
      <h1>{t("lockedAccounts.title")}</h1>
      <p className="locked-accounts__hint">{t("lockedAccounts.intro")}</p>
      {notice && <p className="locked-accounts__notice">{notice}</p>}
      {error && <p className="locked-accounts__error">{error}</p>}
      {body}
    </div>
  );
}
