import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractYouTubeVideoId, getYouTubeMetadata } from "@/lib/youtube";
import { parseLocalISOToDate } from "@/lib/timezone";
import { processDueReminders } from "@/lib/cron";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const whereClause: Record<string, unknown> = { userId: user.id };
  if (courseId) whereClause.courseId = courseId;
  if (status) whereClause.status = status;
  if (startDate && endDate) {
    whereClause.scheduledDate = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const tasks = await prisma.studyTask.findMany({
    where: whereClause,
    include: {
      course: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { courseId, subject, topic, youtubeUrl, scheduledDate, scheduledTime, duration } = await req.json();

    if (!courseId || !subject || !topic || !youtubeUrl || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: "Course, subject, topic, YouTube URL, date, and time are required" },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube video URL" }, { status: 400 });
    }

    // Try fetching title/thumbnail via oEmbed metadata
    const metadata = await getYouTubeMetadata(youtubeUrl, `${subject} - ${topic}`);
    const finalTopic = metadata?.title || topic;

    // Calculate exact scheduledAt UTC timestamp based on user's timezone
    const scheduledDateTime = parseLocalISOToDate(
      scheduledDate,
      scheduledTime,
      user.timezone || "Asia/Kolkata"
    );

    const task = await prisma.studyTask.create({
      data: {
        userId: user.id,
        courseId,
        subject,
        topic: finalTopic,
        youtubeUrl: metadata?.url || youtubeUrl,
        youtubeVideoId: videoId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        duration: duration ? parseInt(duration, 10) : 30,
        status: "PENDING",
      },
      include: { course: true },
    });

    // Create Notification record for background reminder
    const notificationDestination = user.telegramChatId || user.email;
    const notificationChannel = user.telegramLinked && user.telegramChatId ? "TELEGRAM" : "EMAIL";

    await prisma.notification.create({
      data: {
        taskId: task.id,
        userId: user.id,
        channel: notificationChannel,
        destination: notificationDestination,
        scheduledAt: scheduledDateTime,
        status: "PENDING",
      },
    });

    // Asynchronously check for due reminders without blocking task creation
    setTimeout(() => {
      processDueReminders().catch((e) => console.error("Post-task cron trigger error:", e));
    }, 100);

    return NextResponse.json({ task });
  } catch (err) {
    console.error("Create Task Error:", err);
    return NextResponse.json({ error: "Failed to create study task" }, { status: 500 });
  }
}
