"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Smartphone, Play, Info } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ConnectTelegramPage() {
  const [deepLink, setDeepLink] = useState("");
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [botConfigured, setBotConfigured] = useState(true);
  const [manualChatId, setManualChatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { showToast } = useToast();

  const fetchConnectionStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/connect-link");
      if (res.ok) {
        const data = await res.json();
        setDeepLink(data.deepLink);
        setTelegramLinked(data.telegramLinked);
        if (data.telegramChatId) setTelegramChatId(data.telegramChatId);
        if (typeof data.botConfigured === "boolean") setBotConfigured(data.botConfigured);
      }
    } catch (err) {
      console.error("Failed to fetch connection status:", err);
      showToast("Failed to fetch Telegram connection status", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

  const handleManualLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualChatId.trim()) return;

    setLinking(true);
    setMessage(null);

    try {
      const res = await fetch("/api/telegram/manual-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: manualChatId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to link Telegram Chat ID");
      }

      setTelegramLinked(true);
      setTelegramChatId(data.telegramChatId);
      setMessage({ type: "success", text: "✅ Telegram Chat ID connected! Make sure you pressed START in @MystudyNotifierBot." });
      showToast("Telegram connected successfully! 🎉", "success");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error linking Telegram";
      setMessage({ type: "error", text: errMsg });
      showToast(errMsg, "error");
    } finally {
      setLinking(false);
    }
  };

  const handleSendTestMessage = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/telegram/test-send", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Test reminder sent to your Telegram bot! 🚀", "success");
      } else {
        showToast(data.error || "Failed to send test Telegram message", "error");
      }
    } catch (err) {
      console.error("Test send error:", err);
      showToast("Error triggering Telegram test message", "error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider">
          <Send className="w-4 h-4" />
          <span>Notification Channel Setup</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Connect Telegram for Free Reminders</h1>
        <p className="text-slate-600 text-sm">
          Receive instant, free study session reminders delivered straight to your phone via Telegram when your scheduled YouTube videos are ready to watch.
        </p>
      </div>

      {!botConfigured && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Telegram Bot Token Not Configured in .env</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            <code>TELEGRAM_BOT_TOKEN</code> in your <code>.env</code> file is currently set to a placeholder.
          </p>
        </div>
      )}

      {/* Important Notice Callout */}
      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Required First Step on Telegram:</p>
          <p className="leading-relaxed">
            Telegram rules require you to open <b>@MystudyNotifierBot</b> and press <b>START</b> inside Telegram before it can send you reminders. If you don&apos;t press START first, Telegram blocks all bot messages with &quot;chat not found&quot;.
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
          telegramLinked
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-start gap-4">
          {telegramLinked ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-8 h-8 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="font-bold text-base">
              {telegramLinked ? "Telegram Connected & Reminder Ready!" : "Telegram Not Yet Connected"}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {telegramLinked
                ? `Active Chat ID: ${telegramChatId}. Make sure you clicked START in @MystudyNotifierBot on Telegram.`
                : "Connect your Telegram account below to start receiving free study reminders."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {telegramLinked && (
            <button
              onClick={handleSendTestMessage}
              disabled={testing}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{testing ? "Sending..." : "Test Message"}</span>
            </button>
          )}

          <button
            onClick={fetchConnectionStatus}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Step by Step Onboarding */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Method 1: Deep Link Bot */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Option 1: Connect via Bot Deep Link</h4>
              <p className="text-xs text-slate-500">Fastest method on mobile or Telegram desktop</p>
            </div>
          </div>

          <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
            <li>Click the button below to open Telegram</li>
            <li>Tap <b>Start</b> inside the Telegram bot chat</li>
            <li>Your account will link automatically!</li>
          </ol>

          <a
            href={deepLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open @MystudyNotifierBot</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Method 2: Manual Chat ID Link */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Option 2: Direct Chat ID Link</h4>
              <p className="text-xs text-slate-500">For testing or manual setup</p>
            </div>
          </div>

          <form onSubmit={handleManualLink} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Telegram Chat ID</label>
              <input
                type="text"
                value={manualChatId}
                onChange={(e) => setManualChatId(e.target.value)}
                placeholder="e.g. 1602085424"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              type="submit"
              disabled={linking || !manualChatId.trim()}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              {linking ? "Linking Chat ID..." : "Link Telegram Chat ID"}
            </button>
          </form>
          <p className="text-[11px] text-slate-400">
            Tip: Search <b>@userinfobot</b> on Telegram to find your Chat ID.
          </p>
        </div>
      </div>
    </div>
  );
}
