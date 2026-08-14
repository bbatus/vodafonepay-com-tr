"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@payloadcms/ui";
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

function groupDocs(docs: ReorderableDoc[], groupField?: string): [string, ReorderableDoc[]][] {
  const groups = new Map<string, ReorderableDoc[]>();
  for (const doc of docs) {
    const key = (groupField && typeof doc[groupField] === "string" ? (doc[groupField] as string) : undefined) ?? "__all__";
    const list = groups.get(key) ?? [];
    list.push(doc);
    groups.set(key, list);
  }
  return [...groups.entries()];
}

function DraggableGroup({
  collection,
  groupKey,
  initialDocs,
  onSaved,
}: {
  collection: string;
  groupKey: string;
  initialDocs: ReorderableDoc[];
  onSaved: () => void;
}) {
  const [docs, setDocs] = useState(initialDocs);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const strings = { title: t("reorderWidget.title"), saving: t("reorderWidget.saving"), loadError: t("reorderWidget.loadError") };

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...docs];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDocs(reordered);
    setDragIndex(null);
    setSaving(true);
    try {
      await Promise.all(
        reordered.map((doc, i) =>
          doc.order === i
            ? Promise.resolve()
            : fetch(`/api/${collection}/${doc.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ order: i }),
              })
        )
      );
      setDocs(reordered.map((d, i) => ({ ...d, order: i })));
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      {groupKey !== "__all__" && (
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 4 }}>
          {groupKey} {saving && strings.saving}
        </p>
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
    </div>
  );
}

export default function ReorderWidget({ collection, groupField }: { collection: string; groupField?: string }) {
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
    if (!canReorder) return;
    fetch(`/api/${collection}?depth=0&limit=200&sort=order`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setDocs(data.docs ?? []))
      .catch(() => setError(strings.loadError));
  }, [canReorder, collection, strings.loadError]);

  if (!canReorder) return null;
  if (error) return <p style={{ color: "red", padding: "1rem" }}>{error}</p>;
  if (!docs || docs.length < 2) return null;

  const groups = groupDocs(docs, groupField);

  return (
    <div style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
      <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{strings.title}</p>
      {groups.map(([groupKey, groupItems]) =>
        groupItems.length < 2 ? null : (
          <DraggableGroup
            key={groupKey}
            collection={collection}
            groupKey={groupKey}
            initialDocs={groupItems}
            onSaved={() => router.refresh()}
          />
        )
      )}
    </div>
  );
}
