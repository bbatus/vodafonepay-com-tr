/**
 * Single place that turns a failed API call into a message an editor can act
 * on. Before this, every custom component (AccountForm, CsvExportButton,
 * UnlockAccountField, ContentManagementApp, MediaUsageField…) caught its own
 * fetch failures and threw away the real reason — a blocked delete, a locked
 * account, a network drop, and a genuine server crash all rendered the same
 * generic "bir şeyler ters gitti" toast. That's the opposite of what a
 * Maker/Checker needs when a save fails during a real workflow.
 *
 * Payload's own `useForm().submit()` already prefers the server's `message`/
 * `errors[].message` when present (see @payloadcms/ui's Form component) — our
 * `blockDeleteIfReferenced` / role-guard hooks already throw APIError with a
 * human, localized message, so those paths were fine. This module exists for
 * every OTHER call site: plain `fetch()` calls that don't go through
 * Payload's Form machinery at all.
 *
 * Usage: catch the failure, call `describeApiError({ status, body, err, locale, context })`,
 * show the result in a toast. Never re-derive a message ad hoc in a component.
 */

export type ErrorContext = "login" | "campaign" | "faq" | "blog" | "media" | "account" | "export" | "generic";

type Locale = "tr" | "en";

type ApiErrorInput = {
  /** HTTP status code, when a response was received. */
  status?: number;
  /** Parsed JSON response body, when available. */
  body?: unknown;
  /** The thrown error, when the request itself failed (network, abort, parse). */
  err?: unknown;
  locale: Locale;
  context: ErrorContext;
};

const CONTEXT_LABEL: Record<ErrorContext, Record<Locale, string>> = {
  login: { tr: "Giriş", en: "Login" },
  campaign: { tr: "Kampanya", en: "Campaign" },
  faq: { tr: "SSS", en: "FAQ" },
  blog: { tr: "Blog yazısı", en: "Blog post" },
  media: { tr: "Medya", en: "Media" },
  account: { tr: "Hesap", en: "Account" },
  export: { tr: "Dışa aktarma", en: "Export" },
  generic: { tr: "İşlem", en: "Action" },
};

/** HTTP status → human explanation, independent of which flow triggered it. */
const STATUS_MESSAGE: Record<number, Record<Locale, string>> = {
  400: { tr: "Gönderilen bilgiler geçersiz. Alanları kontrol edip tekrar deneyin.", en: "The submitted data is invalid. Check the fields and try again." },
  401: { tr: "Oturumunuz sona ermiş görünüyor. Lütfen tekrar giriş yapın.", en: "Your session appears to have expired. Please log in again." },
  403: { tr: "Bu işlem için yetkiniz yok.", en: "You don't have permission to do this." },
  404: { tr: "Aradığınız kayıt bulunamadı — silinmiş ya da taşınmış olabilir.", en: "The record wasn't found — it may have been deleted or moved." },
  409: { tr: "Bu kayıt başka bir yerde hâlâ kullanılıyor, bu yüzden işlem tamamlanamadı.", en: "This record is still referenced elsewhere, so the action couldn't complete." },
  413: { tr: "Dosya boyutu izin verilenden büyük.", en: "The file is larger than the allowed size." },
  422: { tr: "Gönderilen bilgiler doğrulanamadı. Zorunlu alanları kontrol edin.", en: "The submitted data failed validation. Check required fields." },
  423: { tr: "Bu hesap çok fazla başarısız girişten sonra kilitlendi.", en: "This account is locked after too many failed attempts." },
  429: { tr: "Kısa sürede çok fazla istek gönderildi. Birkaç saniye sonra tekrar deneyin.", en: "Too many requests in a short time. Try again in a few seconds." },
  500: { tr: "Sunucuda beklenmeyen bir hata oluştu. Sorun devam ederse yöneticinize bildirin.", en: "An unexpected server error occurred. Report it if the problem persists." },
  502: { tr: "Sunucuya ulaşılamadı. Birkaç saniye sonra tekrar deneyin.", en: "Couldn't reach the server. Try again in a few seconds." },
  503: { tr: "Sistem şu anda bakımda veya aşırı yüklü. Birkaç dakika sonra tekrar deneyin.", en: "The system is under maintenance or overloaded right now. Try again in a few minutes." },
};

/** Recognizable JS/fetch failure classes that never reach a status code. */
function describeThrown(err: unknown, locale: Locale): string | null {
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
    return locale === "tr"
      ? "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin."
      : "Couldn't reach the server. Check your connection and try again.";
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return locale === "tr" ? "İstek zaman aşımına uğradı." : "The request timed out.";
  }
  return null;
}

/** Pull a server-provided human message out of a Payload-shaped error body, if there is one. */
function messageFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { message?: unknown; errors?: unknown };
  if (typeof b.message === "string" && b.message.trim()) return b.message;
  if (Array.isArray(b.errors)) {
    const first = b.errors.find((e): e is { message: string } => typeof (e as { message?: unknown })?.message === "string");
    if (first) return first.message;
  }
  return null;
}

export function describeApiError({ status, body, err, locale, context }: ApiErrorInput): string {
  // A server that already sent a human-readable message (our own APIError
  // instances, Payload's own validation errors) is always the best source —
  // it's the one place that actually knows what went wrong.
  const serverMessage = messageFromBody(body);
  if (serverMessage) return serverMessage;

  if (err !== undefined) {
    const thrown = describeThrown(err, locale);
    if (thrown) return thrown;
  }

  if (status && STATUS_MESSAGE[status]) return STATUS_MESSAGE[status][locale];

  if (context === "generic") {
    return locale === "tr" ? "İşlem tamamlanamadı. Tekrar deneyin." : "The action couldn't complete. Try again.";
  }
  const label = CONTEXT_LABEL[context][locale];
  return locale === "tr" ? `${label} işlemi tamamlanamadı. Tekrar deneyin.` : `${label} action couldn't complete. Try again.`;
}
