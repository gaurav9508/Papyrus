import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/convexServer";
import { generateNotebookFromUrl } from "@/lib/notebook/generate";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { PaperSummary } from "@/lib/types";

interface RequestBody {
  sessionId: Id<"sessions">;
  paper: PaperSummary;
}

export async function POST(req: NextRequest) {
  const convex = await getAuthenticatedConvexClient();
  const { sessionId, paper } = (await req.json()) as RequestBody;

  try {
    await convex.mutation(api.sessions.setStatus, { sessionId, status: "generating" });

    const result = await generateNotebookFromUrl(paper);

    await convex.mutation(api.notebooks.saveGenerated, {
      sessionId,
      blocks: result.blocks,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notebook generation failed:", err);
    await convex.mutation(api.sessions.setStatus, {
      sessionId,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error.",
    });
    return NextResponse.json({ error: "Notebook generation failed." }, { status: 500 });
  }
}
