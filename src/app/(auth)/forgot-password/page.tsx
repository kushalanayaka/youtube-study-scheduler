"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2, KeyRound, ExternalLink } from "lucide-react";
import { YouTubeIcon } from "@/components/ui/YouTubeIcon";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setResetLink(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process password reset");
      }

      setMessage({
        type: "success",
        text: `Password reset link generated for ${email}. Check your inbox or click below to proceed!`,
      });

      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center bg-red-600 text-white p-3 rounded-2xl shadow-md mb-2">
            <YouTubeIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Reset Your Password</h1>
          <p className="text-xs text-slate-500">
            Enter your registered Gmail or email address and we&apos;ll send you a password reset link.
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registered Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kushal2097@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? "Sending reset link..." : "Send Reset Link"}</span>
          </button>
        </form>

        {resetLink && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-center">
            <p className="text-[11px] font-bold text-slate-600 uppercase">Direct Reset Link Preview</p>
            <a
              href={resetLink}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 underline break-all"
            >
              <span>Click to Reset Password</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Remembered your password?{" "}
          <Link href="/login" className="font-bold text-red-600 hover:text-red-700">
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
