function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

function getBotUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME || "MystudyNotifierBot";
}

export function isTelegramBotConfigured(): boolean {
  const token = getBotToken();
  return Boolean(
    token &&
    token !== "your_telegram_bot_token_from_botfather" &&
    token.trim().length > 0
  );
}

export function getTelegramDeepLink(userId: string): string {
  return `https://t.me/${getBotUsername()}?start=${userId}`;
}

export interface SendTelegramParams {
  chatId: string;
  courseName: string;
  subject: string;
  topic: string;
  youtubeUrl: string;
  scheduledTime: string;
  taskId: string;
}

export async function sendTelegramReminder(params: SendTelegramParams): Promise<{ success: boolean; error?: string }> {
  const token = getBotToken();
  const username = getBotUsername();

  if (!isTelegramBotConfigured()) {
    const errorMsg = "TELEGRAM_BOT_TOKEN is not configured in .env (set to default placeholder).";
    console.warn(`[Telegram] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const messageText = `📚 <b>${escapeHtml(params.courseName)} Study Reminder</b>\n\n` +
    `<b>Subject:</b> ${escapeHtml(params.subject)}\n` +
    `<b>Topic:</b> ${escapeHtml(params.topic)}\n` +
    `<b>Time:</b> ${escapeHtml(params.scheduledTime)}\n\n` +
    `Your scheduled study session is starting now!\n\n` +
    `🎥 <a href="${params.youtubeUrl}"><b>Watch on YouTube</b></a>`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: params.chatId,
        text: messageText,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true };
    } else {
      console.error("[Telegram API Error]:", data);
      let friendlyError = data.description || "Failed to send Telegram message";
      if (data.description?.includes("chat not found")) {
        friendlyError = `Chat not found for @${username}. Please open Telegram, search @${username}, and press START first!`;
      }
      return { success: false, error: friendlyError };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Telegram Network Error]:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendTelegramTextMessage(chatId: string, text: string): Promise<boolean> {
  const token = getBotToken();
  if (!isTelegramBotConfigured()) return false;
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
