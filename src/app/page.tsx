import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  Send,
  ListPlus,
  PlayCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { YouTubeIcon } from "@/components/ui/YouTubeIcon";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl" />
      </div>

      {/* Header Navigation */}
      <header className="relative z-10 h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-white">
          <div className="bg-red-600 text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/30">
            <YouTubeIcon className="w-5 h-5" />
          </div>
          <span className="tracking-tight font-extrabold">StudyScheduler</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="text-xs font-semibold bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-red-900/40 transition-all transform hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 pt-12 pb-20 space-y-20">
        <div className="text-center max-w-4xl mx-auto space-y-6 pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 text-xs font-bold uppercase tracking-wider shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Competitive Exam Aspirants</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Turn YouTube Lectures into an <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">Automated Study Routine</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Bulk schedule playlists, auto-distribute daily video time slots, track progress with FullCalendar, and get instant <b>Telegram reminders</b> straight to your phone.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-red-900/50 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Start Planning Your Study Sessions</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-2xl border border-slate-800 transition-all"
            >
              Log In to Account
            </Link>
          </div>

          {/* Exam Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full">GATE CSE &amp; ECE</span>
            <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full">UPSC CSE</span>
            <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full">JEE Main &amp; Advanced</span>
            <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full">NEET UG</span>
            <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full">SSC &amp; Banking</span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800/80 backdrop-blur-sm space-y-4 hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
              <ListPlus className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Smart Bulk Scheduling</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste YouTube playlist links or multiple video URLs. Choose 1 or 2 lectures per day and let the distributor schedule your entire course automatically.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800/80 backdrop-blur-sm space-y-4 hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Instant Telegram Reminders</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your Telegram bot in seconds. Get automated push alerts with direct YouTube links right before your study time slot begins.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800/80 backdrop-blur-sm space-y-4 hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">FullCalendar Visual Tracker</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              View your study roadmap across month, week, and day grid views. Mark sessions complete or skipped to maintain consistent study momentum.
            </p>
          </div>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-950 p-8 sm:p-12 rounded-3xl border border-red-900/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Free &amp; Open Scheduler</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Stop Losing Study Time to Distractions &amp; Manual Planning
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Organize topics into structured courses, track video duration, save quick study notes, and keep your exam preparation disciplined every day.
            </p>
          </div>

          <Link
            href="/register"
            className="px-8 py-4 bg-white text-slate-950 font-bold text-sm rounded-2xl shadow-lg hover:bg-slate-100 transition-all shrink-0 flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-red-600 fill-red-600" />
            <span>Create Your Free Account</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <YouTubeIcon className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-slate-400">YouTube Study Scheduler</span>
            <span>•</span>
            <span>Empowering Aspirants Daily</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Log In</Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
