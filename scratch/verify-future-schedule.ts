import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { processDueReminders } from "../src/lib/cron";
import { parseLocalISOToDate, getLocalDateISOString } from "../src/lib/timezone";

async function verifyFutureSchedule() {
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

  // Target time: 10 seconds in the future
  const now = new Date();
  const futureDate = new Date(now.getTime() + 10 * 1000);
  const timeStr = `${String(futureDate.getHours()).padStart(2, "0")}:${String(futureDate.getMinutes()).padStart(2, "0")}`;
  const dateStr = getLocalDateISOString(futureDate);

  const scheduledDateTime = parseLocalISOToDate(dateStr, timeStr, user.timezone || "Asia/Kolkata");

  console.log(`[TEST] Current local time: ${now.toLocaleTimeString()}`);
  console.log(`[TEST] Target schedule time: ${dateStr} ${timeStr}`);
  console.log(`[TEST] Calculated UTC scheduledAt: ${scheduledDateTime.toISOString()}`);
  console.log(`[TEST] Is scheduledAt in future? ${scheduledDateTime > now ? "YES ✅" : "NO ❌"}`);

  // 1. Run cron check BEFORE target time arrives
  const beforeCheck = await processDueReminders();
  console.log(`[TEST] Cron result BEFORE target time (should be processed: 0):`, beforeCheck);

  if (scheduledDateTime <= now) {
    console.error("ERROR: scheduledAt was improperly calculated in the past!");
  } else {
    console.log("SUCCESS: Task scheduledAt is accurately placed in the FUTURE!");
  }
}

verifyFutureSchedule()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
