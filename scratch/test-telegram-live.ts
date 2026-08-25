import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { sendTelegramReminder, isTelegramBotConfigured } from "../src/lib/telegram";

async function main() {
  console.log("Is Telegram Bot Configured?", isTelegramBotConfigured());
  console.log("TELEGRAM_BOT_TOKEN from env:", process.env.TELEGRAM_BOT_TOKEN ? "PRESENT" : "MISSING");

  const res = await sendTelegramReminder({
    chatId: "1602085424",
    courseName: "HAL Exam Prep",
    subject: "Computer Networks",
    topic: "Live Scheduled Study Session Test",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    scheduledTime: "00:10",
    taskId: "test-task-123",
  });

  console.log("Telegram Send Result:", res);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
