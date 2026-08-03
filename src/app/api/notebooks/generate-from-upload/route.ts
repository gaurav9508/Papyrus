import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/convexServer";
import { generateNotebookFromUpload } from "@/lib/notebook/generate";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { PaperSummary } from "@/lib/types";

export async function POST(req: NextRequest) {
  const convex = await getAuthenticatedConvexClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const sessionId = formData.get("sessionId") as string | null;
  const title = (formData.get("title") as string | null) ?? "Untitled Upload";

  if (!file || !sessionId) {
    return NextResponse.json({ error: "Missing file or sessionId." }, { status: 400 });
  }

  const typedSessionId = sessionId as Id<"sessions">;

  try {
    await convex.mutation(api.sessions.setStatus, {
      sessionId: typedSessionId,
      status: "generating",
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const paper: PaperSummary = {
      sourceId: "upload",
      source: "upload",
      title,
      authors: [],
      abstract: "",
      externalUrl: "",
    };

    const result = await generateNotebookFromUpload(paper, buffer);

    await convex.mutation(api.notebooks.saveGenerated, {
      sessionId: typedSessionId,
      blocks: result.blocks,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notebook generation from upload failed:", err);
    await convex.mutation(api.sessions.setStatus, {
      sessionId: typedSessionId,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error.",
    });
    return NextResponse.json({ error: "Notebook generation failed." }, { status: 500 });
  }
}
