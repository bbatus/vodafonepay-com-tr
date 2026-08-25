"use client";

import { useState } from "react";
import { toast } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { describeApiError } from "@/lib/apiErrorMessage";

/**
 * Follow-up 25.08: the "Geri Bildirim Gönder" form. Posts to the one endpoint
 * that can write to the `feedback` collection (see Feedback.ts) — this
 * component never reads anything back, because nothing in the admin is
 * allowed to read that table.
 */
export default function FeedbackApp() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [message, setMessage] = useState("");
  const [area, setArea] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          area,
          // Where they were when they opened this screen isn't knowable after
          // navigation, so the referrer is the honest best effort.
          pagePath: typeof document !== "undefined" ? document.referrer || "/admin/feedback" : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(describeApiError({ status: res.status, body, locale, context: "account" }));
      }
      setSent(true);
      setMessage("");
      setArea("");
      toast.success(t("feedback.thanks"));
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("feedback.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="feedback-form">
      <p className="feedback-form__intro">{t("feedback.intro")}</p>

      <label className="feedback-form__field">
        <span className="field-label">{t("feedback.areaLabel")}</span>
        <input
          type="text"
          className="feedback-form__input"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder={t("feedback.areaPlaceholder")}
        />
        <span className="field-description">{t("feedback.areaHint")}</span>
      </label>

      <label className="feedback-form__field">
        <span className="field-label">{t("feedback.messageLabel")}</span>
        <textarea
          className="feedback-form__textarea"
          rows={7}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setSent(false);
          }}
          placeholder={t("feedback.messagePlaceholder")}
        />
      </label>

      {error && <p className="feedback-form__error">{error}</p>}
      {sent && !error && <p className="feedback-form__sent">{t("feedback.thanks")}</p>}

      <button
        type="button"
        className={`btn btn--style-primary btn--size-medium${sending || !message.trim() ? " btn--disabled" : ""}`}
        disabled={sending || !message.trim()}
        onClick={() => void submit()}
      >
        <span className="btn__content">
          <span className="btn__label">{sending ? t("feedback.sending") : t("feedback.send")}</span>
        </span>
      </button>

      <p className="field-description feedback-form__privacy">{t("feedback.privacy")}</p>
    </div>
  );
}
