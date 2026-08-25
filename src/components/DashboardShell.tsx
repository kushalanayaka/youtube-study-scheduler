"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface DashboardShellProps {
  user: {
    name: string;
    email: string;
    telegramLinked: boolean;
  } | null;
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Heartbeat reminder trigger every 15 seconds
  useEffect(() => {
    const triggerHeartbeat = () => {
      fetch("/api/cron/reminders?key=cron-secret-reminder-key-9988").catch(() => {});
    };

    triggerHeartbeat();
    const interval = setInterval(triggerHeartbeat, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />
      <div className="flex flex-1 relative">
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
