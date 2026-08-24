import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { summarizeForExport } from "@/lib/llm/gemini";
import { generateSummaryPdf } from "@/lib/pdf/generateSummaryPdf";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params; // Gotcha #2 — must await

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const scope: "notebook" | "chat" | "both" = body.scope ?? "both";

  const convex = await getAuthenticatedConvexClient();

  const data = await convex.query(api.notebooks.getExportDataForOwner, {
    sessionId: sessionId as Id<"sessions">,
  });

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (data.blocks.length === 0 && data.messages.length === 0) {
    return NextResponse.json(
      { error: "Nothing to summarize yet." },
      { status: 400 },
    );
  }
  const summaryText = await summarizeForExport({
    paperTitle: data.session.paperTitle,
    notebookBlocks: data.blocks,
    chatMessages: data.messages,
    scope,
  });

  const pdfBuffer = await generateSummaryPdf({
    title: `Summary — ${data.session.paperTitle}`,
    summaryText,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="summary-${sessionId}.pdf"`,
    },
  });
}
