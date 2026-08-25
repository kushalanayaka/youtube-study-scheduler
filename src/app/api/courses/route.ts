import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { studyTasks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, startDate, endDate } = await req.json();

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Course name, start date, and end date are required" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json({ course });
  } catch (err) {
    console.error("Create Course Error:", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
