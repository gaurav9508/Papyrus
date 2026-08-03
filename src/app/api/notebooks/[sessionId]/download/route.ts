import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/convexServer";
import { blocksToIpynb } from "@/lib/notebook/ipynb";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const convex = await getAuthenticatedConvexClient();

  const typedSessionId = sessionId as Id<"sessions">;
  const [session, blocks] = await Promise.all([
    convex.query(api.sessions.get, { sessionId: typedSessionId }),
    convex.query(api.notebooks.listForSession, { sessionId: typedSessionId }),
  ]);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const ipynb = blocksToIpynb(session.title, blocks);
  const filename = `${session.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.ipynb`;

  return new NextResponse(JSON.stringify(ipynb, null, 2), {
    headers: {
      "Content-Type": "application/x-ipynb+json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
