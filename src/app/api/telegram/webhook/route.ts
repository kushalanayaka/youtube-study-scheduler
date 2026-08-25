import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramTextMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const update = await req.json();

    if (update?.message?.text && update?.message?.chat?.id) {
      const text: string = update.message.text.trim();
      const chatId: string = String(update.message.chat.id);

      // Check if message is /start <userId>
      if (text.startsWith("/start")) {
        const parts = text.split(" ");
        const userId = parts[1]?.trim();

        if (userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (user) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                telegramChatId: chatId,
                telegramLinked: true,
              },
            });

            await prisma.notification.updateMany({
              where: {
                userId: user.id,
                status: "PENDING",
              },
              data: {
                channel: "TELEGRAM",
                destination: chatId,
              },
            });

            await sendTelegramTextMessage(
              chatId,
              `✅ <b>Account Linked Successfully!</b>\n\nWelcome ${user.name}! You are now set up to receive instant YouTube study session reminders here on Telegram.`
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram Webhook Error:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
