/**
 * OCP readiness probe — see docs/OCP-DEVOPS-RUNBOOK.md §6.2.
 *
 * Deliberately does NOT call out to Clover (the CMS). This site already has
 * a "no fallback, CMS-unreachable is a visible ContentUnavailable state, not
 * a broken page" policy (docs/PROJECT-OVERVIEW.md §7) and pages are served
 * from ISR's cache in between CMS calls — a brief CMS blip shouldn't pull
 * every site pod out of the load balancer, that would turn a partial content
 * problem into a total outage. Readiness here only confirms the Node process
 * itself can respond, same as liveness; if that changes (e.g. a real
 * self-only dependency shows up), add it here without touching liveness.
 */
export async function GET() {
  return Response.json({ status: "ok" });
}
