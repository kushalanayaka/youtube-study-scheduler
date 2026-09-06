import { prisma } from "./prisma";
import { sendTelegramReminder } from "./telegram";
import { sendEmailReminder } from "./email";

export async function processDueReminders() {
  const now = new Date();

  // 0. Automatically expire stale pending notifications older than 15 minutes
  // Prevents sending unexpected late/instant messages for past tasks
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  await prisma.notification.updateMany({
    where: {
      status: "PENDING",
      scheduledAt: { lt: fifteenMinutesAgo },
    },
    data: {
      status: "EXPIRED",
      errorLog: "Stale reminder expired: Scheduled time passed more than 15 minutes ago",
    },
  });

  // 1. Fetch pending notifications due up to now
  const dueNotifications = await prisma.notification.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
    },
    include: {
      task: {
        include: {
          course: true,
        },
      },
      user: true,
    },
    take: 50, // Batch limit
  });

  if (dueNotifications.length === 0) {
    return { processed: 0, successes: 0, failures: 0 };
  }

  let successes = 0;
  let failures = 0;

  for (const notification of dueNotifications) {
    // 2. Atomic lock to prevent duplicate runs
    const updated = await prisma.notification.updateMany({
      where: {
        id: notification.id,
        status: "PENDING",
      },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
      },
    });

    if (updated.count === 0) continue; // Already picked up by another process

    const { task, user } = notification;

    let sendSuccess = false;
    let errorDetail = "";

    // 3. Dispatch to primary channel (Telegram) if user linked Telegram
    if (user.telegramLinked && user.telegramChatId) {
      const telegramResult = await sendTelegramReminder({
        chatId: user.telegramChatId,
        courseName: task.course.name,
        subject: task.subject,
        topic: task.topic,
        youtubeUrl: task.youtubeUrl,
        scheduledTime: task.scheduledTime,
        taskId: task.id,
        videoType: task.videoType,
      });

      if (telegramResult.success) {
        sendSuccess = true;
      } else {
        errorDetail = `Telegram error: ${telegramResult.error || "Unknown"}`;
      }
    }

    // 4. Fallback to Email if Telegram delivery failed or Telegram is unlinked
    if (!sendSuccess) {
      const emailResult = await sendEmailReminder({
        toEmail: user.email,
        courseName: task.course.name,
        subject: task.subject,
        topic: task.topic,
        youtubeUrl: task.youtubeUrl,
        scheduledTime: task.scheduledTime,
        videoType: task.videoType,
      });

      if (emailResult.success) {
        sendSuccess = true;
        errorDetail = errorDetail ? `${errorDetail} | Sent via Email fallback` : "";
      } else {
        errorDetail += ` | Email error: ${emailResult.error || "Unknown"}`;
      }
    }

    // 5. Update final status in DB
    if (sendSuccess) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorLog: errorDetail || null,
        },
      });
      successes++;
    } else {
      const isMaxAttempts = notification.attempts >= 3;
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: isMaxAttempts ? "FAILED" : "PENDING", // Retry up to 3 times
          errorLog: errorDetail,
        },
      });
      failures++;
    }
  }

  return {
    processed: dueNotifications.length,
    successes,
    failures,
  };
}
