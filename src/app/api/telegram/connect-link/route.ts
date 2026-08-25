import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTelegramDeepLink, isTelegramBotConfigured } from "@/lib/telegram";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deepLink = getTelegramDeepLink(user.id);

  return NextResponse.json({
    deepLink,
    telegramLinked: user.telegramLinked,
    telegramChatId: user.telegramChatId,
    botConfigured: isTelegramBotConfigured(),
  });
}
