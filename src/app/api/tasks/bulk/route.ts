import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractYouTubeVideoId, getYouTubeMetadata } from "@/lib/youtube";
import { parseLocalISOToDate } from "@/lib/timezone";
import { processDueReminders } from "@/lib/cron";
import { addDays } from "date-fns";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { courseId, subject, urlsText, urlsArray, startDate, videosPerDay, timeSlots } = await req.json();

    if (!courseId || !subject || !startDate) {
      return NextResponse.json({ error: "Course, subject, and start date are required" }, { status: 400 });
    }

    // Extract raw URLs from text or array
    let rawUrls: string[] = [];
    if (Array.isArray(urlsArray)) {
      rawUrls = urlsArray;
    } else if (typeof urlsText === "string") {
      rawUrls = urlsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    if (rawUrls.length === 0) {
      return NextResponse.json({ error: "At least one YouTube URL must be provided" }, { status: 400 });
    }

    const perDay = Math.max(1, parseInt(videosPerDay || "1", 10));
    const slots: string[] = Array.isArray(timeSlots) && timeSlots.length > 0 ? timeSlots : ["19:00"];

    const baseStartDate = new Date(startDate);
    const createdTasks = [];

    const notificationDestination = user.telegramChatId || user.email;
    const notificationChannel = user.telegramLinked && user.telegramChatId ? "TELEGRAM" : "EMAIL";

    for (let i = 0; i < rawUrls.length; i++) {
      const url = rawUrls[i];
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) continue; // Skip invalid URLs

      const dayOffset = Math.floor(i / perDay);
      const slotIndex = i % perDay;
      const scheduledTime = slots[slotIndex % slots.length] || "19:00";
      const targetDate = addDays(baseStartDate, dayOffset);

      const metadata = await getYouTubeMetadata(url, `${subject} Session ${i + 1}`);
      const topic = metadata?.title || `${subject} - Video ${i + 1}`;

      const dateStr = targetDate.toISOString().split("T")[0];
      const scheduledDateTime = parseLocalISOToDate(
        dateStr,
        scheduledTime,
        user.timezone || "Asia/Kolkata"
      );

      const task = await prisma.studyTask.create({
        data: {
          userId: user.id,
          courseId,
          subject,
          topic,
          youtubeUrl: metadata?.url || `https://www.youtube.com/watch?v=${videoId}`,
          youtubeVideoId: videoId,
          scheduledDate: targetDate,
          scheduledTime,
          duration: 30,
          status: "PENDING",
        },
      });

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

      createdTasks.push(task);
    }

    // Asynchronously trigger due reminders without blocking bulk schedule response
    setTimeout(() => {
      processDueReminders().catch((e) => console.error("Bulk post-task cron trigger error:", e));
    }, 100);

    return NextResponse.json({
      success: true,
      count: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (err) {
    console.error("Bulk Schedule Error:", err);
    return NextResponse.json({ error: "Failed to bulk schedule YouTube tasks" }, { status: 500 });
  }
}
