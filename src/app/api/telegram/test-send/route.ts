import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendTelegramReminder } from "@/lib/telegram";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.telegramLinked || !user.telegramChatId) {
    return NextResponse.json(
      { error: "Telegram is not linked to your account yet." },
      { status: 400 }
    );
  }

  const result = await sendTelegramReminder({
    chatId: user.telegramChatId,
    courseName: "Exam Prep Test Course",
    subject: "Test Subject",
    topic: "Telegram Notification Test",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    scheduledTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    taskId: "test-task-id",
  });

  if (result.success) {
    return NextResponse.json({ success: true, message: "Test reminder sent to your Telegram!" });
  } else {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
}
