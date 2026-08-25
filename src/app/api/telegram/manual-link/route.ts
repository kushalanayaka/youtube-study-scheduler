import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramTextMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId } = await req.json();
    if (!chatId || typeof chatId !== "string") {
      return NextResponse.json({ error: "Valid Telegram Chat ID is required" }, { status: 400 });
    }

    const cleanChatId = chatId.trim();

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        telegramChatId: cleanChatId,
        telegramLinked: true,
      },
    });

    // Retroactively update all pending notifications for this user to deliver via Telegram
    await prisma.notification.updateMany({
      where: {
        userId: currentUser.id,
        status: "PENDING",
      },
      data: {
        channel: "TELEGRAM",
        destination: cleanChatId,
      },
    });

    // Send confirmation message to the Telegram chat
    await sendTelegramTextMessage(
      cleanChatId,
      `✅ <b>Telegram Linked Successfully!</b>\n\nHi ${currentUser.name}, your YouTube Study Scheduler account has been connected. You will receive free study reminders right here!`
    );

    return NextResponse.json({ success: true, telegramChatId: cleanChatId });
  } catch (err) {
    console.error("Manual Telegram Link Error:", err);
    return NextResponse.json({ error: "Failed to link Telegram Chat ID" }, { status: 500 });
  }
}
