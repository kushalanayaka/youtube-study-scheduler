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

    if (!user) {
      // For security, do not leak whether an email exists or not
      return NextResponse.json({
        success: true,
        message: "If that email is registered, a password reset link has been generated.",
      });
    }

    // Generate 1-hour valid token
    const token = await signResetToken({ userId: user.id, email: user.email });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

    // Send email
    await sendPasswordResetEmail({ toEmail: user.email, resetLink });

    return NextResponse.json({
      success: true,
      message: `Password reset link generated for ${user.email}`,
      resetLink, // Included for development convenience
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed to process password reset request." }, { status: 500 });
  }
}
