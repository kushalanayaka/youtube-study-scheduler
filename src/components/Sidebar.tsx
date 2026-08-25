"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  BookOpen,
  PlusCircle,
  ListPlus,
  Send,
  User,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export default function Sidebar({ mobileMenuOpen, onCloseMobileMenu }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Calendar", href: "/calendar", icon: CalendarIcon },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Add Single Video", href: "/tasks/create", icon: PlusCircle },
    { name: "Bulk Schedule", href: "/tasks/bulk-schedule", icon: ListPlus },
    { name: "Connect Telegram", href: "/connect-telegram", icon: Send },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Navigation</span>
          {onCloseMobileMenu && (
            <button
              onClick={onCloseMobileMenu}
              className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onCloseMobileMenu?.()}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-red-600 text-white shadow-md font-semibold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3.5 bg-slate-800/70 rounded-2xl border border-slate-700/50 text-xs space-y-1.5 text-slate-400 mt-6">
        <p className="font-bold text-slate-200 flex items-center gap-1.5">
          <span>💡</span> Exam Prep Tip
        </p>
        <p className="leading-relaxed">
          Schedule 2 videos per day for optimal topic retention &amp; consistent revision.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] shrink-0 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobileMenu}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Content */}
          <aside className="relative w-72 max-w-[80vw] bg-slate-900 text-slate-300 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
