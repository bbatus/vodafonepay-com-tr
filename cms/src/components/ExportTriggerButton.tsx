"use client";

/** The button markup shared by every export trigger (CSV, CEF) — identical across both. */
export function ExportTriggerButton({
  exporting,
  label,
  onClick,
}: {
  exporting: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`btn btn--style-secondary btn--size-medium${exporting ? " btn--disabled" : ""}`}
      disabled={exporting}
      onClick={onClick}
    >
      <span className="btn__content">
        <span className="btn__label">{label}</span>
      </span>
    </button>
  );
}
