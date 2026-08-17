import { NextRequest, NextResponse } from "next/server";
import { getAdminConvexClient } from "@/lib/convexAdmin";
import {
  generateNotebookFromUpload,
  generateNotebookFromUrl,
} from "@/lib/notebook/generate";
import { indexPaperForChat } from "@/lib/rag/indexPaper";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import type { PaperSummary } from "@/lib/types";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.INTERNAL_RETRY_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { sessionId } = (await req.json()) as { sessionId: Id<"sessions"> };
  const convex = getAdminConvexClient();
  const secret = process.env.INTERNAL_RETRY_SECRET!;

  try {
    const data = await convex.query(api.sessionHelpers.getForRetrySystem, {
      sessionId,
      secret,
    });
    if (!data || !data.session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 },
      );
    }
    const { session, fileUrl, fileId } = data;

    await convex.mutation(api.sessions.setStatusSystem, {
      sessionId,
      status: "generating",
      secret,
    });
    await convex.mutation(api.notebooks.clearGeneratedSystem, {
      sessionId,
      secret,
    });

    const paper: PaperSummary = {
      sourceId: session.paperSourceId,
      source: session.paperSource,
      title: session.paperTitle,
      authors: session.paperAuthors,
      abstract: session.paperAbstract,
      externalUrl: session.paperExternalUrl ?? "",
      pdfUrl: session.paperPdfUrl,
    };

    const result =
      session.paperSource === "upload" && fileUrl
        ? await generateNotebookFromUpload(
            paper,
            Buffer.from(await (await fetch(fileUrl)).arrayBuffer()),
            "paper.pdf",
          )
        : await generateNotebookFromUrl(paper);

    await convex.mutation(api.notebooks.saveGeneratedSystem, {
      sessionId,
      blocks: result.blocks,
      secret,
    });

    await indexPaperForChat(
      convex,
      sessionId,
      result.paperText,
      fileId ?? undefined,
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Retry generation failed:", err);
    await convex.mutation(api.sessions.setStatusSystem, {
      sessionId,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Retry failed.",
      secret,
    });
    return NextResponse.json({ error: "Retry failed." }, { status: 500 });
  }
}
