"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  ListPlus,
  Send,
  PlayCircle,
  AlertCircle,
  Search,
  Flame,
  Award,
  Filter,
} from "lucide-react";
import TaskModal, { TaskModalData } from "@/components/tasks/TaskModal";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface Course {
  id: string;
  name: string;
}

interface TaskItem {
  id: string;
  subject: string;
  topic: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  course: Course;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskModalData | null>(null);
  const [userStatus, setUserStatus] = useState<{ telegramLinked: boolean; name: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED" | "SKIPPED">("ALL");

  const { showToast } = useToast();

  const loadDashboardData = useCallback(async () => {
    try {
      const [tasksRes, userRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/user/me"),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserStatus(userData.user);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      showToast("Error loading dashboard data", "error");
    } fontFinally: {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleStatusChange = (taskId: string, newStatus: "PENDING" | "COMPLETED" | "SKIPPED") => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    const label = newStatus === "COMPLETED" ? "completed! 🎉" : newStatus === "SKIPPED" ? "skipped" : "reopened";
    showToast(`Task marked as ${label}`, "success");
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast("Task deleted", "info");
  };

  // Local date calculation (prevents midnight UTC rollback)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const todayTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const d = new Date(t.scheduledDate);
        const taskDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return taskDateStr === todayStr;
      })
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [tasks, todayStr]);

  // Filtered Today Tasks (Chronologically Ordered)
  const filteredTodayTasks = useMemo(() => {
    return todayTasks.filter((t) => {
      const matchesSearch =
        t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.course.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [todayTasks, searchQuery, statusFilter]);

  const completedToday = todayTasks.filter((t) => t.status === "COMPLETED").length;
  const totalCompletedAll = tasks.filter((t) => t.status === "COMPLETED").length;

  // Streak & Study Analytics
  const analytics = useMemo(() => {
    const totalCount = tasks.length;
    const completionRate = totalCount > 0 ? Math.round((totalCompletedAll / totalCount) * 100) : 0;

    // Calculate Streak
    const completedDates = Array.from(
      new Set(
        tasks
          .filter((t) => t.status === "COMPLETED")
          .map((t) => new Date(t.scheduledDate).toISOString().split("T")[0])
      )
    ).sort((a, b) => (a < b ? 1 : -1));

    let streak = 0;
    const checkDate = new Date();

    for (let i = 0; i < 30; i++) {
      const dateString = checkDate.toISOString().split("T")[0];
      if (completedDates.includes(dateString)) {
        streak++;
      } else if (i > 0) {
        // If today has no completed task yet, allow streak to continue from yesterday
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const totalMinutes = tasks
      .filter((t) => t.status === "COMPLETED")
      .reduce((acc, curr) => acc + (curr.duration || 30), 0);

    return { completionRate, streak, totalMinutes };
  }, [tasks, totalCompletedAll]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 py-2">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {userStatus?.name || "Aspirant"}! 🚀
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Stay focused on your study targets and keep your revision streak strong.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <Link
            href="/tasks/create"
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-red-900/30 transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Single Video</span>
          </Link>
          <Link
            href="/tasks/bulk-schedule"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
          >
            <ListPlus className="w-4 h-4" />
            <span>Bulk Schedule</span>
          </Link>
        </div>
      </div>

      {/* Telegram Connection Alert Banner */}
      {userStatus && !userStatus.telegramLinked && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-900 font-medium">
              Telegram reminders are not connected yet. Connect your Telegram to receive instant study notifications on your phone!
            </p>
          </div>
          <Link
            href="/connect-telegram"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Connect Telegram</span>
          </Link>
        </div>
      )}

      {/* Quick Stats & Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Tasks</p>
            <p className="text-2xl font-black text-slate-900">{todayTasks.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Today</p>
            <p className="text-2xl font-black text-slate-900">{completedToday}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Study Streak</p>
            <p className="text-2xl font-black text-slate-900">{analytics.streak} Days</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</p>
            <p className="text-2xl font-black text-slate-900">{analytics.completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Today's Tasks Section with Search & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Today&apos;s Study Schedule</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/80">
              {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject/topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(["ALL", "PENDING", "COMPLETED", "SKIPPED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    statusFilter === status
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {todayTasks.length === 0 ? (
          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <PlayCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No study videos scheduled for today!</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add a single YouTube video or use Bulk Schedule to auto-distribute your study playlist.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/tasks/create"
                className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                Add Study Video
              </Link>
            </div>
          </div>
        ) : filteredTodayTasks.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No study tasks match your search or status filter.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTodayTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md"
              >
                <div
                  onClick={() =>
                    setSelectedTask({
                      ...t,
                      scheduledDate: new Date(t.scheduledDate).toISOString().split("T")[0],
                    })
                  }
                  className="flex items-start gap-4 cursor-pointer flex-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {t.scheduledTime}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                      {t.course.name} • {t.subject}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1 hover:text-red-600 transition-colors">
                      {t.topic}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                      t.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : t.status === "SKIPPED"
                        ? "bg-slate-100 text-slate-600 border border-slate-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {t.status}
                  </span>

                  <button
                    onClick={() =>
                      setSelectedTask({
                        ...t,
                        scheduledDate: new Date(t.scheduledDate).toISOString().split("T")[0],
                      })
                    }
                    className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl transition-colors"
                  >
                    Watch &amp; Notes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Embedded Task Modal */}
      <TaskModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
