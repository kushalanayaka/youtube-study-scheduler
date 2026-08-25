import { NextResponse } from "next/server";
import { getYouTubeMetadata } from "@/lib/youtube";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "YouTube URL parameter is required" }, { status: 400 });
  }

  const metadata = await getYouTubeMetadata(url);

  if (!metadata) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  return NextResponse.json({ metadata });
}
