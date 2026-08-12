"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * RFP §3.1.6: content sorting. The `order` number field already existed on
 * every page-scoped collection (FeeRows/StepCards/FeatureCards/
 * ContentBlocks), but editors had to type a number and guess at ordering
 * relative to siblings — no drag-and-drop. Payload's own drag-reorder only
 * applies to array/blocks SUB-fields inside one document, not to a list of
 * separate collection documents, so this is a real custom admin component
 * (injected via `admin.components.beforeList`) rather than a config flag.
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
  order: number;
  page?: string;
};

function labelOf(doc: ReorderableDoc): string {
  return doc.title || doc.label || doc.name || doc.text || `#${doc.id}`;
}

function groupByPage(docs: ReorderableDoc[]): [string, ReorderableDoc[]][] {
  const groups = new Map<string, ReorderableDoc[]>();
  for (const doc of docs) {
    const key = doc.page ?? "__all__";
    const list = groups.get(key) ?? [];
    list.push(doc);
    groups.set(key, list);
  }
  return [...groups.entries()];
}

function DraggableGroup({
  collection,
  pageKey,
  initialDocs,
  onSaved,
}: {
  collection: string;
  pageKey: string;
  initialDocs: ReorderableDoc[];
  onSaved: () => void;
}) {
  const [docs, setDocs] = useState(initialDocs);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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
      {pageKey !== "__all__" && <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 4 }}>{pageKey} {saving && "(kaydediliyor…)"}</p>}
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

export default function ReorderWidget({ collection }: { collection: string }) {
  const router = useRouter();
  const [docs, setDocs] = useState<ReorderableDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/${collection}?depth=0&limit=200&sort=order`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setDocs(data.docs ?? []))
      .catch(() => setError("Liste yüklenemedi."));
  }, [collection]);

  if (error) return <p style={{ color: "red", padding: "1rem" }}>{error}</p>;
  if (!docs || docs.length < 2) return null;

  const groups = groupByPage(docs);

  return (
    <div style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
      <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Sürükleyerek sırala</p>
      {groups.map(([pageKey, groupDocs]) =>
        groupDocs.length < 2 ? null : (
          <DraggableGroup
            key={pageKey}
            collection={collection}
            pageKey={pageKey}
            initialDocs={groupDocs}
            onSaved={() => router.refresh()}
          />
        )
      )}
    </div>
  );
}
