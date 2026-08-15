"use client";

import { useEffect } from "react";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

const STORAGE_KEY = "vf-remembered-login-email";

/**
 * F1: "beni hatırla" — remembers ONLY the email (localStorage), never the
 * password and never the session length (that's already a fixed 12h, see
 * Users.ts's `auth.tokenExpiration` — not touched here). Payload 3.x has no
 * `views.login` override point (only account/forgot/reset), so this can't
 * be a real form field wired into LoginForm's own React state — it's a
 * `beforeLogin` slot component (rendered outside the actual <form>) that
 * DOM-injects a checkbox into the real form and syncs with the real email
 * input directly.
 *
 * Deliberately defensive: every DOM lookup can fail silently (selector
 * drift, a Payload upgrade changing markup) without ever throwing — this
 * must never be able to break the actual login flow, only the convenience
 * feature on top of it.
 */
export default function RememberEmailCheckbox() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    // Payload's own EmailField hydrates its controlled value from React
    // state slightly AFTER this component's mount effect fires (they're
    // sibling trees, not parent/child), so a single synchronous DOM write
    // here can get silently overwritten a tick later. This re-applies the
    // prefill a few times on a short delay — idempotent, harmless once the
    // field already shows the right value.
    const prefillEmail = (emailInput: HTMLInputElement, value: string) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(emailInput, value);
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    };

    const trySetup = (): boolean => {
      const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
      const inputWrap = document.querySelector<HTMLElement>(".login__form__inputWrap");
      const form = document.querySelector<HTMLFormElement>("form.login__form");
      if (!emailInput || !inputWrap || !form || form.querySelector(".vf-remember-email")) {
        return false;
      }

      try {
        const remembered = window.localStorage.getItem(STORAGE_KEY);
        if (remembered) {
          prefillEmail(emailInput, remembered);
          for (const delay of [50, 200, 500]) {
            setTimeout(() => {
              if (!cancelled && emailInput.isConnected && !emailInput.value) {
                prefillEmail(emailInput, remembered);
              }
            }, delay);
          }
        }

        const wrapper = document.createElement("label");
        wrapper.className = "vf-remember-email";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(remembered);
        const text = document.createElement("span");
        text.textContent = t("rememberEmail.label");
        wrapper.append(checkbox, text);

        checkbox.addEventListener("change", () => {
          if (!checkbox.checked) {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        });

        form.addEventListener("submit", () => {
          if (checkbox.checked) {
            window.localStorage.setItem(STORAGE_KEY, emailInput.value);
          } else {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        });

        inputWrap.after(wrapper);
        return true;
      } catch {
        // Storage disabled/unavailable, or markup didn't match — the
        // convenience feature just doesn't appear. Login itself is untouched.
        return false;
      }
    };

    if (trySetup()) return;

    const observer = new MutationObserver(() => {
      if (cancelled) return;
      if (trySetup()) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Give up after 5s so a permanently-broken selector doesn't leave a
    // dangling observer running for the rest of the session.
    const timeoutId = setTimeout(() => observer.disconnect(), 5000);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [t]);

  // Nothing rendered here directly — the checkbox is injected straight into
  // the real login form's DOM so it visually sits with the other fields.
  return null;
}
