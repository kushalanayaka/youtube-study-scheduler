import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user) {
      // Generate 1-hour valid single-use token tied to passwordHash
      const token = await signResetToken({
        userId: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
      });

      const host = req.headers.get("host") || "youtube-study-scheduler.onrender.com";
      const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
      const resetLink = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

      // Dispatch password reset email via Resend
      const emailResult = await sendPasswordResetEmail({ toEmail: user.email, resetLink });
      if (!emailResult.success) {
        console.error(`[Forgot Password Email Failed] User: ${user.email}, Error: ${emailResult.error}`);
      }
    }

    const responsePayload: { success: boolean; message: string; debugResetLink?: string } = {
      success: true,
      message: "If an account exists for this email, a password reset link has been sent to your inbox.",
    };

    // Attach preview link ONLY in local development environment
    if (process.env.NODE_ENV === "development" && user) {
      const token = await signResetToken({
        userId: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
      });
      const host = req.headers.get("host") || "localhost:3000";
      responsePayload.debugResetLink = `http://${host}/reset-password?token=${token}`;
    }

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error("Forgot password server error:", err);
    return NextResponse.json({ error: "Failed to process password reset request.", debugError: String(err?.stack || err?.message || err) }, { status: 500 });
  }
}
