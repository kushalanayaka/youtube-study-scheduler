import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractYouTubeVideoId, getYouTubeMetadata } from "@/lib/youtube";
import { parseLocalISOToDate } from "@/lib/timezone";
import { processDueReminders } from "@/lib/cron";
import { addDays } from "date-fns";

import { detectVideoProvider } from "@/lib/gdrive";

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

    // Extract raw lines from text or array
    let rawLines: string[] = [];
    if (Array.isArray(urlsArray)) {
      rawLines = urlsArray;
    } else if (typeof urlsText === "string") {
      rawLines = urlsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    if (rawLines.length === 0) {
      return NextResponse.json({ error: "At least one video URL must be provided" }, { status: 400 });
    }

    const perDay = Math.max(1, parseInt(videosPerDay || "1", 10));
    const slots: string[] = Array.isArray(timeSlots) && timeSlots.length > 0 ? timeSlots : ["19:00"];

    const baseStartDate = new Date(startDate);
    const createdTasks = [];

    const notificationDestination = user.telegramChatId || user.email;
    const notificationChannel = user.telegramLinked && user.telegramChatId ? "TELEGRAM" : "EMAIL";

    let validIndex = 0;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      let customTopic: string | null = null;
      let url = line;

      // Handle custom title formatting: "Topic Title | Video URL" or "Subject | Topic | URL"
      if (line.includes("|")) {
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length >= 2) {
          url = parts[parts.length - 1];
          customTopic = parts.slice(0, parts.length - 1).join(" - ");
        }
      }

      const { provider, videoId, watchUrl } = detectVideoProvider(url);
      if (!videoId || provider === "UNKNOWN") continue; // Skip invalid URLs

      const dayOffset = Math.floor(validIndex / perDay);
      const slotIndex = validIndex % perDay;
      const scheduledTime = slots[slotIndex % slots.length] || "19:00";
      const targetDate = addDays(baseStartDate, dayOffset);

      let topic = customTopic || `${subject} - Video ${validIndex + 1}`;
      let finalUrl = watchUrl;

      if (provider === "YOUTUBE") {
        const metadata = await getYouTubeMetadata(url, topic);
        if (metadata?.title && !customTopic) topic = metadata.title;
        if (metadata?.url) finalUrl = metadata.url;
      } else if (provider === "GDRIVE" && !customTopic) {
        topic = `${subject} - Drive Lecture ${validIndex + 1}`;
      }

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
          videoType: provider,
          youtubeUrl: finalUrl,
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
      validIndex++;
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
