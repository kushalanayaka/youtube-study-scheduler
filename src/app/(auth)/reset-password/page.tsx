"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { YouTubeIcon } from "@/components/ui/YouTubeIcon";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-200">
          Missing password reset token. Please request a new link from the Forgot Password page.
        </div>
        <Link
          href="/forgot-password"
          className="inline-block px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs"
        >
          Go to Forgot Password
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="p-6 bg-emerald-50 text-emerald-800 rounded-3xl border border-emerald-200 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-bold">Password Reset Successful! 🎉</h3>
          <p className="text-xs text-emerald-700">Redirecting to login page in 2 seconds...</p>
        </div>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs"
        >
          Log In Now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-2xl">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Password</label>
        <div className="relative">
          <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
        <div className="relative">
          <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
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
        <span>{loading ? "Updating Password..." : "Set New Password"}</span>
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center bg-red-600 text-white p-3 rounded-2xl shadow-md mb-2">
            <YouTubeIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Set New Password</h1>
          <p className="text-xs text-slate-500">Create a secure password for your account.</p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>

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
