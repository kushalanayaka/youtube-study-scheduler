"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Send, Globe, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  telegramChatId: string | null;
  telegramLinked: boolean;
  timezone: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch((err) => {
        console.error("Profile load error:", err);
        showToast("Error loading profile details", "error");
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleTestCron = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/cron/reminders?key=cron-secret-reminder-key-9988");
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
      showToast("Scheduler diagnostic worker completed!", "info");
    } catch (err) {
      setTestResult(`Test execution error: ${String(err)}`);
      showToast("Scheduler test error", "error");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-2">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 text-sm">Manage your profile and notification reminder channels.</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-md border border-slate-800">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{user.name}</h2>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="flex items-center gap-2 font-semibold text-slate-700">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Email Address</span>
            </span>
            <span className="text-slate-600 font-medium">{user.email}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="flex items-center gap-2 font-semibold text-slate-700">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Timezone</span>
            </span>
            <span className="text-slate-600 font-medium">{user.timezone}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="flex items-center gap-2 font-semibold text-slate-700">
              <Send className="w-4 h-4 text-sky-500" />
              <span>Telegram Status</span>
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                  user.telegramLinked
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {user.telegramLinked ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Linked ({user.telegramChatId})
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-amber-600" /> Not Linked
                  </>
                )}
              </span>
              <Link
                href="/connect-telegram"
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 underline"
              >
                Configure
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduler Test & Diagnostics */}
      <div className="bg-slate-900 text-slate-200 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-sm">Notification Scheduler Diagnostics</h3>
            <p className="text-xs text-slate-400">Trigger due reminder worker manually to test notifications</p>
          </div>
          <button
            onClick={handleTestCron}
            disabled={testing}
            className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-md shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{testing ? "Running..." : "Test Worker"}</span>
          </button>
        </div>

        {testResult && (
          <pre className="p-4 bg-slate-950 rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
            {testResult}
          </pre>
        )}
      </div>
    </div>
  );
}
