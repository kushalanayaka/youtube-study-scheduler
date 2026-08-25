import { prisma } from "../src/lib/prisma";

async function resetNotifications() {
  const user = await prisma.user.findFirst({
    where: { email: "kushal2097@gmail.com" },
  });

  if (!user || !user.telegramChatId) {
    console.log("User or Telegram Chat ID not found.");
    return;
  }

  // Set scheduledAt to 1 minute in the future
  const futureTime = new Date(Date.now() + 60 * 1000);

  const updated = await prisma.notification.updateMany({
    where: { userId: user.id },
    data: {
      channel: "TELEGRAM",
      destination: user.telegramChatId,
      scheduledAt: futureTime,
      status: "PENDING",
      attempts: 0,
      errorLog: null,
    },
  });

  console.log(`Updated ${updated.count} notifications to PENDING for Telegram Chat ID ${user.telegramChatId}`);
  console.log(`Scheduled At: ${futureTime.toISOString()} (in 60 seconds)`);
}

resetNotifications()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
