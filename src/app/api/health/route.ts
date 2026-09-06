import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      userCount,
      hasResendKey: Boolean(process.env.RESEND_API_KEY),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "NOT_SET",
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        error: String(err?.message || err),
        stack: String(err?.stack || ""),
        hasResendKey: Boolean(process.env.RESEND_API_KEY),
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "NOT_SET",
      },
      { status: 500 }
    );
  }
}
