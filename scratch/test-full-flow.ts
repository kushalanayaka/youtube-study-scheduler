import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { processDueReminders } from "../src/lib/cron";
import { parseLocalISOToDate } from "../src/lib/timezone";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "kushal2097@gmail.com" },
  });

  if (!user || !user.telegramChatId) {
    console.log("User or Telegram Chat ID missing.");
    return;
  }

  const course = await prisma.course.findFirst();
  if (!course) {
    console.log("No course found.");
    return;
  }

  console.log("Creating new scheduled test task for Telegram...");

  // Schedule for 2 seconds in the past so it is immediately due
  const now = new Date();
  const pastDate = new Date(now.getTime() - 2000);
  const timeStr = `${String(pastDate.getHours()).padStart(2, "0")}:${String(pastDate.getMinutes()).padStart(2, "0")}`;
  const dateStr = pastDate.toISOString().split("T")[0];

  const scheduledDateTime = parseLocalISOToDate(dateStr, timeStr, user.timezone || "Asia/Kolkata");

  const task = await prisma.studyTask.create({
    data: {
      userId: user.id,
      courseId: course.id,
      subject: "GATE / HAL Prep",
      topic: "Live Scheduled Reminder Test - Telegram Bot",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: "dQw4w9WgXcQ",
      scheduledDate: pastDate,
      scheduledTime: timeStr,
      duration: 30,
      status: "PENDING",
    },
  });

  await prisma.notification.create({
    data: {
      taskId: task.id,
      userId: user.id,
      channel: "TELEGRAM",
      destination: user.telegramChatId,
      scheduledAt: scheduledDateTime,
      status: "PENDING",
    },
  });

  console.log(`Task created ID: ${task.id}`);
  console.log(`Scheduled At UTC: ${scheduledDateTime.toISOString()}`);
  console.log("Executing processDueReminders()...");

  const result = await processDueReminders();
  console.log("Process Result:", result);

  const finalNotification = await prisma.notification.findFirst({
    where: { taskId: task.id },
  });

  console.log("Final Notification DB Status:", finalNotification?.status);
  console.log("Error Log:", finalNotification?.errorLog);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
