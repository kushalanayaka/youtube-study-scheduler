import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = String(body.email).toLowerCase().trim();

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    } catch (dbErr: any) {
      console.error("[Login Database Lookup Error]:", dbErr?.message || dbErr);
      return NextResponse.json({ error: "Database error during login. Please try again." }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isPasswordValid = await verifyPassword(body.password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    let token;
    try {
      token = await signToken({ userId: user.id, email: user.email });
    } catch (jwtErr: any) {
      console.error("[Login JWT Sign Error]:", jwtErr?.message || jwtErr);
      return NextResponse.json({ error: "Authentication token error." }, { status: 500 });
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        telegramLinked: user.telegramLinked,
        timezone: user.timezone,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[Login Unhandled Error]:", err?.message || err);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
