"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLES } from "@/access/roles";

/**
 * RFP §3.1.6: content sorting. The `order` number field already existed on
 * every collection that renders as an ordered list (StepCards/FeatureCards/
 * ContentBlocks/FaqItems/NavLinks/Announcements/FeeRows/LimitTables), but
 * editors had to type a number and guess at ordering relative to siblings —
 * no drag-and-drop. Payload's own drag-reorder only applies to array/blocks
 * SUB-fields inside one document, not to a list of separate collection
 * documents, so this is a real custom admin component (injected via
 * `admin.components.beforeList`) rather than a config flag.
 *
 * `groupField` scopes reordering to siblings that actually compete for the
 * same `order` sequence (e.g. StepCards' `page`, NavLinks' `section`,
 * FaqItems' `category`) — dragging can only reorder within one group, never
 * across unrelated ones. Collections with a single flat list (FeeRows,
 * LimitTables, Announcements) omit it and get one group.
 *
 * Native HTML5 drag events are used instead of pulling in a drag-and-drop
 * library — this widget's interaction surface (reorder a flat list) doesn't
 * need one.
 */

type ReorderableDoc = {
  id: string | number;
  title?: string;
  label?: string;
  text?: string;
  name?: string;
  question?: string;
  order: number;
  [key: string]: unknown;
};

function labelOf(doc: ReorderableDoc): string {
  return doc.title || doc.label || doc.name || doc.text || doc.question || `#${doc.id}`;
}

/**
 * `groupField`'s value can be a plain string (StepCards' `page`, NavLinks'
 * `section` — both `select` fields), a bare relationship id (FaqItems'
 * `category` fetched at depth:0, since this widget never needs the full
 * related doc), or a populated relationship object if some future caller
 * fetches deeper. All three need to become one stable string key so items
 * pointing at the same category actually land in the same reorder group —
 * before FaqItems.category became a relationship, this only ever saw
 * strings, so a plain `typeof === "string"` check was enough; it silently
 * collapsed every category into a single group the moment that changed.
 */
function groupKeyOf(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id: string | number }).id;
    return String(id);
  }
  return undefined;
}

function groupLabelOf(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const v = value as { label?: string; title?: string; name?: string };
    return v.label ?? v.title ?? v.name ?? fallback;
  }
  return typeof value === "string" ? value : fallback;
}

/**
 * `groupField` values that are `select` fields (Categories' `scope`, unlike
 * FaqItems' relationship `category`) come back as the bare option VALUE —
 * Payload's REST API doesn't resolve a select's i18n option label server
 * side. `groupLabels` is an optional value→display-label override a caller
 * can pass in for exactly this case (see Categories.ts's clientProps).
 */
function groupDocs(
  docs: ReorderableDoc[],
  groupField?: string,
  groupLabels?: Record<string, string>
): [string, string, ReorderableDoc[]][] {
  const groups = new Map<string, { label: string; items: ReorderableDoc[] }>();
  for (const doc of docs) {
    const raw = groupField ? doc[groupField] : undefined;
    const key = groupKeyOf(raw) ?? "__all__";
    const entry = groups.get(key) ?? { label: groupLabels?.[key] ?? groupLabelOf(raw, key), items: [] };
    entry.items.push(doc);
    groups.set(key, entry);
  }
  return [...groups.entries()].map(([key, { label, items }]) => [key, label, items]);
}

/**
 * RFP follow-up: dragging used to PATCH immediately on drop, no confirm step
 * and no `.ok` check — a 403 on one item mid-batch saved a silently partial
 * order with nothing telling the editor. Now a drop only reorders local
 * state; nothing reaches the server until "Kaydet". Multiple drags in a row
 * batch into ONE save instead of prompting per-drop, which is what "Evet
 * tıklarsa ana websitesinde yerleri değişmeli" actually needs without being
 * tedious to use.
 */
function DraggableGroup({
  collection,
  groupKey,
  groupLabel,
  initialDocs,
  onSaved,
  onDirtyChange,
  hideLabel = false,
}: {
  collection: string;
  groupKey: string;
  groupLabel: string;
  initialDocs: ReorderableDoc[];
  onSaved: () => void;
  /** Lets a parent (GroupedReorder) block switching groups while this one has unsaved drags. */
  onDirtyChange?: (dirty: boolean) => void;
  /** GroupedReorder already shows the group name in its dropdown — the label paragraph below would just repeat it. */
  hideLabel?: boolean;
}) {
  const [docs, setDocs] = useState(initialDocs);
  // RFP follow-up: a successful save used to leave "Kaydet"/"Vazgeç" showing
  // forever — `dirty` compared `docs` against the `initialDocs` PROP, which
  // never changes after a save (the parent's `onSaved` just does
  // `router.refresh()`, which re-renders server components but doesn't touch
  // this already-mounted client component's props). Comparing against this
  // separate `savedOrder` state instead, updated the moment a save actually
  // succeeds, is what lets the buttons — and the "unsaved changes" notice —
  // actually go away.
  const [savedDocs, setSavedDocs] = useState(initialDocs);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const strings = {
    saving: t("reorderWidget.saving"),
    save: t("reorderWidget.save"),
    discard: t("reorderWidget.discard"),
    unsavedNotice: t("reorderWidget.unsavedNotice"),
    saveError: t("reorderWidget.saveError"),
    saveSuccess: t("reorderWidget.saveSuccess"),
  };

  const dirty = docs.some((doc, i) => doc.id !== savedDocs[i]?.id);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...docs];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDocs(reordered);
    setDragIndex(null);
    setSaveError(false);
  };

  const handleDiscard = () => {
    setDocs(savedDocs);
    setSaveError(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      // RFP feedback 5.5: positions are 1-based. This used to write the raw
      // array index, so the first item always saved as 0 — which read as
      // "unset" everywhere else (it's the value the old defaultValue produced)
      // and made the saved sequence indistinguishable from a brand-new record.
      const nextOrder = docs.map((doc, i) => ({ ...doc, order: i + 1 }));
      const results = await Promise.all(
        nextOrder.map((doc, i) =>
          docs[i].order === doc.order
            ? Promise.resolve(true)
            : fetch(`/api/${collection}/${doc.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ order: doc.order }),
              }).then((res) => res.ok)
        )
      );
      if (results.some((ok) => !ok)) {
        // Best-effort, not all-or-nothing: some PATCHes above may have
        // already landed server-side by the time one fails. Deliberately
        // does NOT move the local "saved" baseline here — which of the
        // partial writes landed isn't reliably knowable from the client, so
        // "Kaydet"/"Vazgeç" keep showing (safe: worst case the editor
        // re-saves an already-correct row) rather than risk clearing the
        // notice while the real list is still wrong. `onSaved()` still
        // refreshes the surrounding page so the underlying table reflects
        // whatever really landed.
        setSaveError(true);
        toast.error(strings.saveError);
        onSaved();
        return;
      }
      setDocs(nextOrder);
      setSavedDocs(nextOrder);
      toast.success(strings.saveSuccess);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      {!hideLabel && groupKey !== "__all__" && (
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 4 }}>{groupLabel}</p>
      )}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {docs.map((doc, i) => (
          <li
            key={doc.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            style={{
              padding: "0.5rem 0.75rem",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              cursor: "grab",
              opacity: dragIndex === i ? 0.5 : 1,
            }}
          >
            ⠿ {labelOf(doc)}
          </li>
        ))}
      </ul>
      {dirty && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button
            type="button"
            className="btn btn--style-primary btn--size-small"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            <span className="btn__content">
              <span className="btn__label">{saving ? strings.saving : strings.save}</span>
            </span>
          </button>
          <button
            type="button"
            className="btn btn--style-secondary btn--size-small"
            disabled={saving}
            onClick={handleDiscard}
          >
            <span className="btn__content">
              <span className="btn__label">{strings.discard}</span>
            </span>
          </button>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{strings.unsavedNotice}</span>
        </div>
      )}
      {saveError && <p style={{ fontSize: "0.8rem", color: "#b91c1c", marginTop: "0.4rem" }}>{strings.saveError}</p>}
    </div>
  );
}

export type GroupsFrom = {
  /** The collection that defines the canonical list of groups (e.g. "categories"). */
  collection: string;
  /** Restricts that collection to the groups relevant here (e.g. `{ scope: { equals: "faq" } }`). */
  where?: Record<string, unknown>;
};

export default function ReorderWidget({
  collection,
  groupField,
  groupLabels,
  groupsFrom,
}: {
  collection: string;
  groupField?: string;
  groupLabels?: Record<string, string>;
  /**
   * When set, the group list (and each group's item count) comes from the
   * server up front — including groups with zero or one item, which used to
   * be invisible entirely (a category nobody had filed a question under yet
   * didn't exist as far as this widget knew). Selecting a group then fetches
   * ONLY that group's documents, instead of the old behavior of fetching
   * every document in the collection (silently truncated at 200) and
   * grouping client-side.
   */
  groupsFrom?: GroupsFrom;
}) {
  const router = useRouter();
  const [docs, setDocs] = useState<ReorderableDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const strings = { title: t("reorderWidget.title"), saving: t("reorderWidget.saving"), loadError: t("reorderWidget.loadError") };
  const { user } = useAuth();
  const role = (user as { role?: string } | undefined)?.role;
  // Every collection this widget is wired into (see admin.components.beforeList
  // in each collection config) uses newVerticalReadWrite for `update` — only
  // NV Maker/Checker can actually write. Everyone else (Growth roles, who
  // still land on these list pages because `read` is public/authenticated)
  // used to see the same draggable list and could drag an item into a new
  // position — the UI updated optimistically, but every PATCH the drag
  // issued 403'd server-side, so the "reorder" silently never saved. Hiding
  // the widget for roles with no real write access here is more honest than
  // a control that visually works but does nothing.
  const canReorder = role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.NEW_VERTICAL_CHECKER;

  useEffect(() => {
    if (!canReorder || groupsFrom) return;
    // depth:1 so a relationship groupField (FaqItems' `category`) populates
    // with a real label instead of a bare id — see groupLabelOf above.
    fetch(`/api/${collection}?depth=1&limit=200&sort=order`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setDocs(data.docs ?? []))
      .catch(() => setError(strings.loadError));
  }, [canReorder, collection, groupsFrom, strings.loadError]);

  if (!canReorder) return null;

  if (groupsFrom) {
    return (
      <ServerGroupedReorder
        collection={collection}
        groupField={groupField ?? ""}
        groupsFrom={groupsFrom}
        title={strings.title}
        onSaved={() => router.refresh()}
      />
    );
  }

  if (error) return <p style={{ color: "red", padding: "1rem" }}>{error}</p>;
  if (!docs || docs.length < 2) return null;

  const groups = groupDocs(docs, groupField, groupLabels).filter(([, , items]) => items.length >= 2);
  if (groups.length === 0) return null;

  // Only one group (or no groupField at all) — nothing to pick between,
  // render it directly like before groups existed.
  if (groups.length === 1) {
    const [groupKey, groupLabel, groupItems] = groups[0];
    return (
      <div style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
        <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{strings.title}</p>
        <DraggableGroup
          collection={collection}
          groupKey={groupKey}
          groupLabel={groupLabel}
          initialDocs={groupItems}
          onSaved={() => router.refresh()}
        />
      </div>
    );
  }

  return <GroupedReorder collection={collection} groups={groups} title={strings.title} onSaved={() => router.refresh()} />;
}

/**
 * Multiple groups (e.g. Categories' `scope`: Kampanya/Blog vs. SSS, each
 * with its own competing `order` sequence) used to render every group's
 * draggable list stacked one after another — reordering FAQ categories
 * meant scrolling past every campaign category first. A dropdown showing
 * one group at a time is what the reorder-per-flow request actually asked
 * for: pick a flow, see and drag only that flow's items.
 */
function GroupedReorder({
  collection,
  groups,
  title,
  onSaved,
}: {
  collection: string;
  groups: [string, string, ReorderableDoc[]][];
  title: string;
  onSaved: () => void;
}) {
  const [selectedKey, setSelectedKey] = useState(groups[0][0]);
  // Switching groups remounts DraggableGroup (key={selectedKey}), which would
  // silently throw away an unsaved drag in the group being left — block the
  // switch instead, matching the "confirm before losing work" ask.
  const [dirty, setDirty] = useState(false);
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const selected = groups.find(([key]) => key === selectedKey) ?? groups[0];
  const [, , selectedItems] = selected;

  return (
    <div style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <p style={{ fontWeight: 600, margin: 0 }}>{title}</p>
        <select
          value={selectedKey}
          disabled={dirty}
          onChange={(e) => setSelectedKey(e.target.value)}
          style={{ padding: "0.3rem 0.5rem", border: "1px solid #e5e7eb", borderRadius: 4 }}
        >
          {groups.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {dirty && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{t("reorderWidget.switchGroupBlocked")}</span>}
      </div>
      <DraggableGroup
        // Remounts on group switch — each group keeps its own drag state
        // via initialDocs instead of this component reconciling stale rows.
        key={selectedKey}
        collection={collection}
        groupKey={selectedKey}
        groupLabel={selected[1]}
        initialDocs={selectedItems}
        onSaved={onSaved}
        onDirtyChange={setDirty}
        hideLabel
      />
    </div>
  );
}

type GroupOption = { id: string | number; label: string; count: number };

/**
 * `groupsFrom` path: the dropdown's OWN list of options comes from a real
 * server query (`groupsFrom.collection`), not from whatever categories
 * happened to already have a document — so a brand-new, still-empty
 * category shows up immediately with "(0)" instead of not existing as far
 * as this widget is concerned. Selecting an option fetches only that
 * group's documents on demand.
 */
function ServerGroupedReorder({
  collection,
  groupField,
  groupsFrom,
  title,
  onSaved,
}: {
  collection: string;
  groupField: string;
  groupsFrom: GroupsFrom;
  title: string;
  onSaved: () => void;
}) {
  const [options, setOptions] = useState<GroupOption[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [items, setItems] = useState<ReorderableDoc[] | null>(null);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsError, setItemsError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const locale = useAdminLocale();
  const t = useDbStrings(locale);

  useEffect(() => {
    const whereQuery = groupsFrom.where
      ? `&${Object.entries(groupsFrom.where)
          .map(([field, cond]) => {
            const [op, val] = Object.entries(cond as Record<string, unknown>)[0];
            return `where[${field}][${op}]=${encodeURIComponent(String(val))}`;
          })
          .join("&")}`
      : "";
    fetch(`/api/${groupsFrom.collection}?depth=0&limit=200&sort=order${whereQuery}`, { credentials: "include" })
      .then((r) => r.json())
      .then(async (data) => {
        const groups: { id: string | number; label?: string; title?: string; name?: string }[] = data.docs ?? [];
        const withCounts = await Promise.all(
          groups.map(async (g) => {
            const countRes = await fetch(`/api/${collection}?depth=0&limit=0&where[${groupField}][equals]=${g.id}`, {
              credentials: "include",
            });
            const countData = await countRes.json().catch(() => ({ totalDocs: 0 }));
            return { id: g.id, label: g.label ?? g.title ?? g.name ?? String(g.id), count: countData.totalDocs ?? 0 };
          })
        );
        setOptions(withCounts);
        if (withCounts.length > 0) setSelectedId(withCounts[0].id);
      })
      .catch(() => setLoadError(true));
    // groupsFrom.where is a plain object literal from clientProps (static per collection config) — safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, groupField, groupsFrom.collection]);

  useEffect(() => {
    if (selectedId === null) return;
    // startTransition keeps these first setStates out of the effect's
    // synchronous body (react-hooks/set-state-in-effect) — same pattern as
    // ContentManagementApp.tsx's load().
    startTransition(() => {
      setItems(null);
      setItemsError(false);
    });
    const ITEMS_LIMIT = 500;
    fetch(`/api/${collection}?depth=0&limit=${ITEMS_LIMIT}&sort=order&where[${groupField}][equals]=${selectedId}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        setItems(data.docs ?? []);
        setItemsTotal(data.totalDocs ?? (data.docs ?? []).length);
      })
      .catch(() => setItemsError(true));
  }, [collection, groupField, selectedId]);

  if (loadError) return <p style={{ color: "red", padding: "1rem" }}>{t("reorderWidget.loadError")}</p>;
  if (!options) return null;
  if (options.length === 0) return null;

  const selectedOption = options.find((o) => o.id === selectedId) ?? options[0];

  return (
    <div style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <p style={{ fontWeight: 600, margin: 0 }}>{title}</p>
        <select
          value={String(selectedId ?? "")}
          disabled={dirty}
          onChange={(e) => {
            const next = options.find((o) => String(o.id) === e.target.value);
            if (next) setSelectedId(next.id);
          }}
          style={{ padding: "0.3rem 0.5rem", border: "1px solid #e5e7eb", borderRadius: 4 }}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label} ({o.count})
            </option>
          ))}
        </select>
        {dirty && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{t("reorderWidget.switchGroupBlocked")}</span>}
      </div>

      {itemsError && <p style={{ color: "red" }}>{t("reorderWidget.loadError")}</p>}
      {!itemsError && items === null && <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>{t("reorderWidget.loadingItems")}</p>}
      {!itemsError && items !== null && selectedOption.count < 2 && (
        <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>{t("reorderWidget.emptyGroup")}</p>
      )}
      {!itemsError && items !== null && selectedOption.count >= 2 && (
        <>
          {itemsTotal > items.length && (
            <p style={{ fontSize: "0.8rem", color: "#b45309", marginBottom: "0.4rem" }}>
              {t("reorderWidget.truncatedNotice").replace("{shown}", String(items.length)).replace("{total}", String(itemsTotal))}
            </p>
          )}
          <DraggableGroup
            key={selectedId}
            collection={collection}
            groupKey={String(selectedId)}
            groupLabel={selectedOption.label}
            initialDocs={items}
            onSaved={onSaved}
            onDirtyChange={setDirty}
            hideLabel
          />
        </>
      )}
    </div>
  );
}
