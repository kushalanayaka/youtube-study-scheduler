import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { processDueReminders } from "../src/lib/cron";
import { parseLocalISOToDate, getLocalDateISOString } from "../src/lib/timezone";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "kushal2097@gmail.com" },
  });

  if (!user || !user.telegramChatId) {
    console.log("User missing or Telegram not linked.");
    return;
  }

  const course = await prisma.course.findFirst();
  if (!course) {
    console.log("No course found.");
    return;
  }

  // Schedule task for TOMORROW at 8:00 AM
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dateStr = getLocalDateISOString(tomorrow);
  const timeStr = "08:00";

  const scheduledDateTime = parseLocalISOToDate(dateStr, timeStr, user.timezone || "Asia/Kolkata");

  console.log(`[TEST] Current local time: ${new Date().toLocaleString()}`);
  console.log(`[TEST] Creating task for Tomorrow 8:00 AM: ${dateStr} ${timeStr}`);
  console.log(`[TEST] Calculated UTC scheduledAt: ${scheduledDateTime.toISOString()}`);

  const task = await prisma.studyTask.create({
    data: {
      userId: user.id,
      courseId: course.id,
      subject: "Computer Science",
      topic: "Tomorrow Morning 8 AM GATE Lecture",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: "dQw4w9WgXcQ",
      scheduledDate: tomorrow,
      scheduledTime: timeStr,
      duration: 60,
      status: "PENDING",
    },
  });

  const notification = await prisma.notification.create({
    data: {
      taskId: task.id,
      userId: user.id,
      channel: "TELEGRAM",
      destination: user.telegramChatId,
      scheduledAt: scheduledDateTime,
      status: "PENDING",
    },
  });

  console.log(`[TEST] Task created. Task ID: ${task.id}`);
  console.log(`[TEST] Notification created. ID: ${notification.id}, status: ${notification.status}`);

  console.log("[TEST] Triggering processDueReminders() right now...");
  const result = await processDueReminders();
  console.log("[TEST] Process result (MUST be 0 processed):", result);

  const checkNotification = await prisma.notification.findUnique({
    where: { id: notification.id },
  });

  console.log("[TEST] Notification status in DB right now:", checkNotification?.status);

  if (result.processed === 0 && checkNotification?.status === "PENDING") {
    console.log("\n✅ PERFECT! The notification did NOT fire today. It is safely PENDING for tomorrow 8:00 AM!");
  } else {
    console.error("\n❌ FAILED! Notification fired prematurely.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
