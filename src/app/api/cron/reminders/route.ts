import { NextResponse } from "next/server";
import { processDueReminders } from "@/lib/cron";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secretKey = searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  const expectedSecret = process.env.CRON_SECRET || "cron-secret-reminder-key-9988";

  if (secretKey !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
  }

  try {
    const result = await processDueReminders();
    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      summary: result,
    });
  } catch (err) {
    console.error("Cron Error:", err);
    return NextResponse.json({ error: "Internal Cron Execution Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
