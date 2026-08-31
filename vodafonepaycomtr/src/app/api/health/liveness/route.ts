/**
 * OCP liveness probe — see docs/OCP-DEVOPS-RUNBOOK.md §6.2 (this route
 * didn't exist; the template assumes Spring's `/actuator/health/liveness`).
 * No dependency checks on purpose: liveness only answers "is the Node
 * process alive" — a slow/unreachable CMS should fail READINESS, not get
 * this pod killed and restarted (killing it would not fix a CMS outage,
 * only add a restart loop on top of it).
 */
export async function GET() {
  return Response.json({ status: "ok" });
}
