import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchPapers } from "@/lib/api/paperSearch";

export async function GET(req: NextRequest) {
  await auth.protect();

  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'." },
      { status: 400 },
    );
  }

  try {
    const results = await searchPapers(query.trim());
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Paper search failed:", err);
    return NextResponse.json(
      { error: "Failed to search papers." },
      { status: 502 },
    );
  }
}
