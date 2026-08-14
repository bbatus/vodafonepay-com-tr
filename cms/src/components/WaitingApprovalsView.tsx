import type { CSSProperties } from "react";
import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { ROLES } from "@/access/roles";
import { loadDbStrings } from "@/lib/loadDbStrings";

type Counts = { approved: number; rejected: number; total: number };

type PendingCampaign = { id: string | number; title: string; createdByEmail?: string };

async function loadCounts(payload: Payload): Promise<Counts> {
  const [approvedRes, rejectedRes, totalRes] = await Promise.all([
    payload.count({
      collection: "audit-logs",
      where: { and: [{ action: { equals: "publish" } }, { collectionSlug: { equals: "campaigns" } }] },
      overrideAccess: true,
    }),
    payload.count({
      collection: "audit-logs",
      where: { and: [{ action: { equals: "rejected" } }, { collectionSlug: { equals: "campaigns" } }] },
      overrideAccess: true,
    }),
    payload.count({
      collection: "audit-logs",
      where: { and: [{ action: { equals: "create" } }, { collectionSlug: { equals: "campaigns" } }] },
      overrideAccess: true,
    }),
  ]);
  return { approved: approvedRes.totalDocs, rejected: rejectedRes.totalDocs, total: totalRes.totalDocs };
}

async function loadPending(payload: Payload): Promise<PendingCampaign[]> {
  // `payload.find({..., draft: true})` reads via the same code path as
  // `GET ?draft=true`, which `denyUnauthenticatedDraftRead` (beforeOperation
  // hook on Campaigns) unconditionally blocks for requests with no bound
  // `req.user` — including this Local API call, regardless of
  // `overrideAccess: true` (that hook isn't an access-control function, it
  // runs before them). `findVersions` is a distinct operation type
  // ("readVersions", not "read") that the hook never inspects, and it's
  // also the only way to see a Maker's plain draft resubmission — Payload
  // only syncs the base "campaigns" table row on PUBLISH, so `find` without
  // `draft: true` would show stale pre-resubmit data anyway.
  const { docs } = await payload.findVersions({
    collection: "campaigns",
    where: {
      and: [
        { latest: { equals: true } },
        { "version._status": { equals: "draft" } },
        { "version.reviewStatus": { equals: "pending" } },
      ],
    },
    sort: "-updatedAt",
    limit: 50,
    depth: 1,
    overrideAccess: true,
  });
  return docs.map((d) => {
    const doc = d as unknown as {
      parent: string | number;
      version: { title?: string; createdBy?: { email?: string } | string | null };
    };
    return {
      id: doc.parent,
      title: doc.version.title ?? String(doc.parent),
      createdByEmail: typeof doc.version.createdBy === "object" && doc.version.createdBy ? doc.version.createdBy.email : undefined,
    };
  });
}

const cardStyle: CSSProperties = {
  padding: "1.25rem 1.5rem",
  minWidth: 180,
};

const numStyle: CSSProperties = {
  fontSize: "2rem",
  fontWeight: 700,
  margin: "0.25rem 0 0",
};

/**
 * RFP feedback 3.11: a dedicated page (not just a dashboard card) for
 * whoever can approve/reject Campaigns — running approved/rejected/total
 * counters plus the current unresponded list, all in one place. Registered
 * as a top-level custom admin view (admin.components.views in
 * payload.config.ts), which Payload does NOT wrap in the standard
 * nav/topbar template by default — DefaultTemplate is applied here
 * explicitly to match every other admin page.
 */
export default async function WaitingApprovalsView(props: {
  payload: Payload;
  i18n: I18nClient;
  locale?: { code: string } | string;
  initPageResult?: {
    req?: PayloadRequest;
    permissions?: unknown;
    visibleEntities?: { collections?: string[]; globals?: string[] };
  };
}) {
  const { payload, i18n, initPageResult } = props;
  const locale: "tr" | "en" = i18n?.language === "en" ? "en" : "tr";
  // The `user` ServerProp is NOT actually passed to top-level custom views
  // by Payload's RootPage (confirmed by reading its source — serverProps
  // there only carries payload/i18n/locale/initPageResult, no top-level
  // user) — only `initPageResult.req.user` has it. Relying on the
  // (always-undefined-here) top-level prop would silently let this
  // access-control check pass for everyone, including Growth Maker.
  const user = (initPageResult?.req as PayloadRequest | undefined)?.user as { role?: string } | undefined;
  const role = user?.role;

  const tt = await loadDbStrings(payload, locale);
  const t = {
    title: tt("waitingApprovals.title"),
    approved: tt("waitingApprovals.approved"),
    rejected: tt("waitingApprovals.rejected"),
    total: tt("waitingApprovals.total"),
    pendingTitle: tt("waitingApprovals.pendingTitle"),
    pendingEmpty: tt("waitingApprovals.pendingEmpty"),
    openedBy: tt("waitingApprovals.openedBy"),
    review: tt("waitingApprovals.review"),
    noAccess: tt("waitingApprovals.noAccess"),
  };

  const permissions = initPageResult?.permissions as Parameters<typeof DefaultTemplate>[0]["permissions"];
  const visibleEntities = (initPageResult?.visibleEntities ?? { collections: [], globals: [] }) as Parameters<
    typeof DefaultTemplate
  >[0]["visibleEntities"];
  const req = initPageResult?.req as PayloadRequest;

  const body =
    role === ROLES.GROWTH_MAKER ? (
      <p style={{ padding: "2rem", color: "var(--theme-elevation-500)" }}>{t.noAccess}</p>
    ) : (
      <WaitingApprovalsBody payload={payload} locale={locale} t={t} />
    );

  return (
    <DefaultTemplate
      req={req}
      payload={payload}
      i18n={i18n}
      locale={props.locale as never}
      user={user as never}
      permissions={permissions}
      visibleEntities={visibleEntities}
      viewType="waiting-approvals"
    >
      {body}
    </DefaultTemplate>
  );
}

async function WaitingApprovalsBody({
  payload,
  locale,
  t,
}: {
  payload: Payload;
  locale: "tr" | "en";
  t: Record<string, string>;
}) {
  const [counts, pending] = await Promise.all([loadCounts(payload), loadPending(payload)]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ margin: "0 0 1.5rem" }}>{t.title}</h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div className="card" style={cardStyle}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--theme-elevation-500)" }}>{t.approved}</p>
          <p style={numStyle}>{counts.approved}</p>
        </div>
        <div className="card" style={cardStyle}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--theme-elevation-500)" }}>{t.rejected}</p>
          <p style={{ ...numStyle, color: "var(--vf-red)" }}>{counts.rejected}</p>
        </div>
        <div className="card" style={cardStyle}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--theme-elevation-500)" }}>{t.total}</p>
          <p style={numStyle}>{counts.total}</p>
        </div>
      </div>

      <p style={{ fontWeight: 600, margin: "0 0 0.5rem" }}>{t.pendingTitle}</p>
      <div className="card" style={{ padding: "0.5rem 0", maxWidth: 720 }}>
        {pending.length === 0 ? (
          <p style={{ margin: "0.5rem 1rem", color: "var(--theme-elevation-500)", fontSize: "0.875rem" }}>{t.pendingEmpty}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.5rem 1rem", color: "var(--theme-elevation-500)", fontWeight: 500 }}>
                  {locale === "tr" ? "Kampanya" : "Campaign"}
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem 1rem", color: "var(--theme-elevation-500)", fontWeight: 500 }}>
                  {t.openedBy}
                </th>
                <th style={{ padding: "0.5rem 1rem" }} />
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: "0.5rem 1rem" }}>{p.title}</td>
                  <td style={{ padding: "0.5rem 1rem", color: "var(--theme-elevation-500)" }}>{p.createdByEmail ?? "—"}</td>
                  <td style={{ padding: "0.5rem 1rem", textAlign: "right" }}>
                    <a href={`/admin/collections/campaigns/${p.id}`} style={{ color: "var(--vf-red)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {t.review}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
