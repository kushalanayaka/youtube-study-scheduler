import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status } = await req.json();

    if (!["PENDING", "COMPLETED", "SKIPPED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const task = await prisma.studyTask.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updatedTask = await prisma.studyTask.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (err) {
    console.error("Update Task Status Error:", err);
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
  }
}
