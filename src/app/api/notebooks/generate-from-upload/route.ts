import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/convexServer";
import { generateNotebookFromUpload } from "@/lib/notebook/generate";
import { indexPaperForChat } from "@/lib/rag/indexPaper";
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
    return NextResponse.json(
      { error: "Missing file or sessionId." },
      { status: 400 },
    );
  }

  const typedSessionId = sessionId as Id<"sessions">;

  try {
    await convex.mutation(api.sessions.setStatus, {
      sessionId: typedSessionId,
      status: "generating",
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Persist the raw PDF to Convex file storage.
    const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: buffer,
    });
    if (!uploadRes.ok) {
      throw new Error(`File storage upload failed: ${uploadRes.status}`);
    }
    const { storageId } = (await uploadRes.json()) as {
      storageId: Id<"_storage">;
    };

    const fileId = await convex.mutation(api.files.savePaperFile, {
      sessionId: typedSessionId,
      storageId,
      filename: file.name,
      contentType: file.type || undefined,
    });

    const paper: PaperSummary = {
      sourceId: "upload",
      source: "upload",
      title,
      authors: [],
      abstract: "",
      externalUrl: "",
    };

    const result = await generateNotebookFromUpload(paper, buffer, file.name);

    await convex.mutation(api.notebooks.saveGenerated, {
      sessionId: typedSessionId,
      blocks: result.blocks,
    });

    await indexPaperForChat(convex, typedSessionId, result.paperText, fileId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notebook generation from upload failed:", err);
    await convex.mutation(api.sessions.setStatus, {
      sessionId: typedSessionId,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error.",
    });
    return NextResponse.json(
      { error: "Notebook generation failed." },
      { status: 500 },
    );
  }
}
