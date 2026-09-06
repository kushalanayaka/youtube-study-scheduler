import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyResetToken, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const payload = await verifyResetToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Verify token single-use check (if pwdVer exists in payload, ensure password was not changed since token generation)
    if (payload.pwdVer && user.passwordHash.slice(-12) !== payload.pwdVer) {
      return NextResponse.json(
        { error: "This password reset link has already been used. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password and update database
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset! You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
