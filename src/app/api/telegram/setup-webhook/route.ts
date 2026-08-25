import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === "your_telegram_bot_token_from_botfather") {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is not configured in environment" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host") || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const webhookUrl = `${host.replace(/\/$/, "")}/api/telegram/webhook`;

  try {
    // 1. Call setWebhook
    const setRes = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    const setData = await setRes.json();

    // 2. Query getWebhookInfo
    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const infoData = await infoRes.json();

    return NextResponse.json({
      setWebhookResult: setData,
      webhookInfo: infoData,
      configuredUrl: webhookUrl,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
