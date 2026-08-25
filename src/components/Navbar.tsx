"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Menu, X } from "lucide-react";
import { YouTubeIcon } from "@/components/ui/YouTubeIcon";
import { useToast } from "@/components/ui/Toast";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    telegramLinked: boolean;
  } | null;
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export default function Navbar({ user, mobileMenuOpen, onToggleMobileMenu }: NavbarProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      showToast("Logged out successfully", "info");
      router.push("/login");
      router.refresh();
    } catch {
      showToast("Failed to log out", "error");
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-slate-800">
          <div className="bg-red-600 text-white p-1.5 rounded-xl flex items-center justify-center shadow-sm">
            <YouTubeIcon className="w-5 h-5" />
          </div>
          <span className="tracking-tight">StudyScheduler</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              href="/connect-telegram"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                user.telegramLinked
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">
                {user.telegramLinked ? "Telegram Connected" : "Connect Telegram"}
              </span>
              <span className="xs:hidden">{user.telegramLinked ? "Connected" : "Telegram"}</span>
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 font-medium"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white border border-slate-700 flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline font-semibold">{user.name}</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
