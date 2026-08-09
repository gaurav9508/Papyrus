import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/convexServer";
import { generateNotebookFromUrl } from "@/lib/notebook/generate";
import { indexPaperForChat } from "@/lib/rag/indexPaper";
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
    await convex.mutation(api.sessions.setStatus, {
      sessionId,
      status: "generating",
    });

    // Persist the source PDF to Convex file storage, same as the upload flow.
    let fileId: Id<"paperFiles"> | undefined;
    if (paper.pdfUrl) {
      const pdfRes = await fetch(paper.pdfUrl);
      if (pdfRes.ok) {
        const buffer = Buffer.from(await pdfRes.arrayBuffer());
        const uploadUrl = await convex.mutation(
          api.files.generateUploadUrl,
          {},
        );
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/pdf" },
          body: buffer,
        });
        if (uploadRes.ok) {
          const { storageId } = (await uploadRes.json()) as {
            storageId: Id<"_storage">;
          };
          fileId = await convex.mutation(api.files.savePaperFile, {
            sessionId,
            storageId,
            filename: `${paper.title || "paper"}.pdf`,
            contentType: "application/pdf",
          });
        } else {
          console.error("Paper PDF storage upload failed:", uploadRes.status);
        }
      } else {
        console.error("Fetching paper PDF for storage failed:", pdfRes.status);
      }
    }

    const result = await generateNotebookFromUrl(paper);

    await convex.mutation(api.notebooks.saveGenerated, {
      sessionId,
      blocks: result.blocks,
    });

    await indexPaperForChat(convex, sessionId, result.paperText, fileId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notebook generation failed:", err);
    await convex.mutation(api.sessions.setStatus, {
      sessionId,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error.",
    });
    return NextResponse.json(
      { error: "Notebook generation failed." },
      { status: 500 },
    );
  }
}
