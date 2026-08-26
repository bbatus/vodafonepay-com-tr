// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import RememberEmailCheckbox from "@/components/RememberEmailCheckbox";

vi.mock("@payloadcms/ui", () => ({
  useTranslation: () => ({ i18n: { language: "tr" } }),
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) })
  );
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

function renderLoginForm() {
  document.body.innerHTML = `
    <form class="login__form">
      <div class="login__form__inputWrap">
        <input name="email" />
      </div>
    </form>
  `;
}

describe("RememberEmailCheckbox", () => {
  it("renders nothing itself", () => {
    renderLoginForm();
    const { container } = render(<RememberEmailCheckbox />);
    expect(container).toBeEmptyDOMElement();
  });

  it("injects a checkbox next to the email field once the login form is present", async () => {
    renderLoginForm();
    render(<RememberEmailCheckbox />);
    await waitFor(() => {
      expect(document.querySelector(".vf-remember-email")).not.toBeNull();
    });
    expect(document.querySelector(".vf-remember-email input[type=checkbox]")).not.toBeNull();
  });

  it("prefills the email input from localStorage and checks the box when a value was remembered", async () => {
    localStorage.setItem("vf-remembered-login-email", "editor@vodafone.local");
    renderLoginForm();
    render(<RememberEmailCheckbox />);
    await waitFor(() => {
      const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
      expect(emailInput?.value).toBe("editor@vodafone.local");
    });
    const checkbox = document.querySelector<HTMLInputElement>(".vf-remember-email input[type=checkbox]");
    expect(checkbox?.checked).toBe(true);
  });

  it("saves the email to localStorage on submit when checked", async () => {
    renderLoginForm();
    render(<RememberEmailCheckbox />);
    await waitFor(() => expect(document.querySelector(".vf-remember-email")).not.toBeNull());

    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]')!;
    const checkbox = document.querySelector<HTMLInputElement>(".vf-remember-email input[type=checkbox]")!;
    emailInput.value = "someone@vodafone.local";
    checkbox.checked = true;

    const form = document.querySelector("form.login__form")!;
    form.dispatchEvent(new Event("submit"));

    expect(localStorage.getItem("vf-remembered-login-email")).toBe("someone@vodafone.local");
  });

  it("clears localStorage on submit when unchecked", async () => {
    localStorage.setItem("vf-remembered-login-email", "old@vodafone.local");
    renderLoginForm();
    render(<RememberEmailCheckbox />);
    await waitFor(() => expect(document.querySelector(".vf-remember-email")).not.toBeNull());

    const checkbox = document.querySelector<HTMLInputElement>(".vf-remember-email input[type=checkbox]")!;
    checkbox.checked = false;

    const form = document.querySelector("form.login__form")!;
    form.dispatchEvent(new Event("submit"));

    expect(localStorage.getItem("vf-remembered-login-email")).toBeNull();
  });

  it("does not throw when the login form markup is entirely absent", () => {
    document.body.innerHTML = "<div></div>";
    expect(() => render(<RememberEmailCheckbox />)).not.toThrow();
  });
});
